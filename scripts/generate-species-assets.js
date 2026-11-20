import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { dragonBalance } from "../src/species/balance.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const species = Object.keys(dragonBalance);
const names = {
  fire:"Fogo", water:"Água", ice:"Gelo", electric:"Elétrico", earth:"Terra",
  lava:"Lava", wind:"Vento", sound:"Som", poison:"Veneno", sand:"Areia",
  light:"Luz", plasma:"Plasma", acid:"Ácido", radioactive:"Radioativo", shadow:"Sombra"
};
const palettes = {
  fire:["#292326","#702c28","#d94b25","#ffb33d"],
  water:["#173b58","#286f91","#4bb6c7","#b6f4e9"],
  ice:["#263e61","#668eae","#b9e4f2","#ffffff"],
  electric:["#24304e","#5365a4","#65c9e9","#f9ef9b"],
  earth:["#302d25","#63523a","#8d9a55","#c4b77c"],
  lava:["#321c19","#78301d","#d64c1e","#ffb52f"],
  wind:["#35485b","#7199a8","#b5d8d2","#f5f0d5"],
  sound:["#292843","#554d86","#9a8ad1","#e2d5ff"],
  poison:["#263a2b","#476c3a","#91b63d","#d5e76d"],
  sand:["#55422d","#967044","#c8a66a","#f0d7a0"],
  light:["#5a4a2b","#b58d39","#f0d36e","#fff7ce"],
  plasma:["#26223f","#51447c","#9a67d5","#c9e5ff"],
  acid:["#303e24","#657c2c","#a9bd37","#e6f27c"],
  radioactive:["#2e3b25","#637d2b","#a9c43a","#e4ef70"],
  shadow:["#171821","#303047","#5a4d78","#a68bd1"]
};
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function crc32(buf){
  let c=0xffffffff;
  for(const byte of buf){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}
  return (c^0xffffffff)>>>0;
}
function chunk(type,data){
  const name=Buffer.from(type);const length=Buffer.alloc(4);length.writeUInt32BE(data.length);
  const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([length,name,data,checksum]);
}
function png(size,palette){
  const colors=palette.map(rgb);
  const rows=[];
  for(let y=0;y<size;y++){
    const row=Buffer.alloc(1+size*4);row[0]=0;
    for(let x=0;x<size;x++){
      const scale=(Math.floor(x/5)+Math.floor(y/4)+((x*y)%11<3?1:0))%4;
      const belly=y>size*0.68 && x>size*0.25 && x<size*0.75;
      const accent=((x*7+y*11)%37===0)||((x+y)%19===0);
      const color=belly?colors[1]:colors[accent?3:scale];
      const i=1+x*4;row[i]=color[0];row[i+1]=color[1];row[i+2]=color[2];row[i+3]=255;
    }
    rows.push(row);
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(Buffer.concat(rows))),chunk("IEND",Buffer.alloc(0))]);
}
async function writeJson(file,value){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(value,null,2)+"\n");}
const baseGeo=JSON.parse(await readFile(path.join(root,"bedrock/resource_pack/models/entity/dragon_fire.geo.json"),"utf8"));
const baseAnim=JSON.parse(await readFile(path.join(root,"bedrock/resource_pack/animations/dragon_fire.animation.json"),"utf8"));
const baseAnimController=JSON.parse(await readFile(path.join(root,"bedrock/resource_pack/animation_controllers/dragon_fire.animation_controllers.json"),"utf8"));
const baseRender=JSON.parse(await readFile(path.join(root,"bedrock/resource_pack/render_controllers/dragon_fire.render_controllers.json"),"utf8"));
const itemAtlas=JSON.parse(await readFile(path.join(root,"bedrock/resource_pack/textures/item_texture.json"),"utf8"));
const langFile=path.join(root,"bedrock/resource_pack/texts/pt_BR.lang");
let lang=(await readFile(langFile,"utf8")).trim();
for(const id of species){
  const b=dragonBalance[id], scale=Number((b.height/3.2).toFixed(3));
  const entityId="dragon_survival:"+id+"_dragon";
  const geo=structuredClone(baseGeo);
  const geometry=geo["minecraft:geometry"][0];
  geometry.description.identifier="geometry.dragon_survival."+id;
  geometry.description.visible_bounds_width=Math.max(5,b.width*3.4);
  geometry.description.visible_bounds_height=Math.max(5,b.height*2.8);
  if(id==="poison") geometry.bones=geometry.bones.filter(bone=>!["rear_leg_left","rear_leg_right"].includes(bone.name));
  if(id==="wind"){
    for(const side of ["left","right"]){
      const wing=structuredClone(geometry.bones.find(bone=>bone.name==="wing_"+side));
      wing.name="wing_rear_"+side;wing.pivot[1]-=3;wing.pivot[2]+=13;
      wing.cubes.forEach(cube=>{if(cube.origin)cube.origin[2]+=13;if(cube.pivot)cube.pivot[2]+=13;});
      geometry.bones.push(wing);
      for(const childName of ["wing_membrane_","wing_tip_"]){
        const original=geometry.bones.find(bone=>bone.name===childName+side);
        if(!original)continue;
        const child=structuredClone(original);child.name=childName+"rear_"+side;child.parent=wing.name;
        child.pivot[1]-=3;child.pivot[2]+=13;
        child.cubes?.forEach(cube=>{if(cube.origin)cube.origin[2]+=13;if(cube.pivot)cube.pivot[2]+=13;});
        geometry.bones.push(child);
      }
    }
  }
  await writeJson(path.join(root,"bedrock/resource_pack/models/entity/dragon_"+id+".geo.json"),geo);
  await writeFile(path.join(root,"bedrock/resource_pack/textures/entity/dragon_"+id+".png"),png(128,palettes[id]));
  await writeFile(path.join(root,"bedrock/resource_pack/textures/items/dragon_"+id+"_spawn_egg.png"),png(16,palettes[id]));
  const animation=structuredClone(baseAnim);
  for(const [key,value] of Object.entries(animation.animations)){
    value.bones ??= {};
    if(id==="poison"){
      delete value.bones.rear_leg_left;
      delete value.bones.rear_leg_right;
    }
    if(id==="wind"){
      for(const side of ["left","right"]){
        const sign=side==="left"?-1:1;
        if(key.endsWith(".idle")){
          value.bones["wing_rear_"+side]={rotation:[0,0,sign*5]};
          value.bones["wing_tip_rear_"+side]={rotation:[0,0,sign*3]};
        } else if(key.endsWith(".walk")){
          value.bones["wing_rear_"+side]={rotation:[0,0,sign*10]};
          value.bones["wing_tip_rear_"+side]={rotation:[0,0,sign*5]};
        } else if(key.endsWith(".fly")){
          value.bones["wing_rear_"+side]={rotation:[0,0,sign===-1?"-42 + math.sin(query.anim_time * 14 + 0.35) * 30":"42 - math.sin(query.anim_time * 14 + 0.35) * 30"]};
          value.bones["wing_tip_rear_"+side]={rotation:[0,0,sign===-1?"-16 + math.sin(query.anim_time * 14 + 0.75) * 13":"16 - math.sin(query.anim_time * 14 + 0.75) * 13"]};
        }
      }
    }
  }
  const animText=JSON.stringify(animation).replaceAll("dragon_survival.fire","dragon_survival."+id);
  await writeFile(path.join(root,"bedrock/resource_pack/animations/dragon_"+id+".animation.json"),animText+"\n");
  const controller=structuredClone(baseAnimController);
  const controllerText=JSON.stringify(controller).replaceAll("dragon_survival.fire","dragon_survival."+id).replaceAll("fire_idle",id+"_idle").replaceAll("fire_walk",id+"_walk").replaceAll("fire_fly",id+"_fly");
  await writeFile(path.join(root,"bedrock/resource_pack/animation_controllers/dragon_"+id+".animation_controllers.json"),controllerText+"\n");
  const render=structuredClone(baseRender);
  const renderText=JSON.stringify(render).replaceAll("dragon_survival.fire","dragon_survival."+id);
  await writeFile(path.join(root,"bedrock/resource_pack/render_controllers/dragon_"+id+".render_controllers.json"),renderText+"\n");
  const bp={
    format_version:"1.21.0",
    "minecraft:entity":{
      description:{identifier:entityId,is_spawnable:true,is_summonable:true,is_experimental:false},
      components:{
        "minecraft:type_family":{family:["dragon","dragon_survival",id+"_dragon","monster"]},
        "minecraft:health":{value:b.health,max:b.health},
        "minecraft:collision_box":{width:b.width,height:b.height},
        "minecraft:scale":{value:scale},
        "minecraft:movement":{value:b.groundSpeed},
        "minecraft:movement.fly":{value:b.flightSpeed},
        "minecraft:movement.basic":{},
        "minecraft:navigation.walk":{can_path_over_water:id==="water",avoid_water:id!=="water",avoid_damage_blocks:true},
        "minecraft:navigation.fly":{can_path_over_water:true,avoid_damage_blocks:true},
        "minecraft:physics":{has_gravity:true,has_collision:true},
        "minecraft:pushable":{is_pushable:true,is_pushable_by_piston:true},
        "minecraft:nameable":{},
        "minecraft:behavior.float":{priority:0},
        "minecraft:behavior.random_stroll":{priority:6,speed_multiplier:0.8},
        "minecraft:behavior.random_fly":{priority:7,speed_multiplier:1.0},
        "minecraft:behavior.look_at_player":{priority:8,look_distance:12,probability:0.04},
        "minecraft:behavior.random_look_around":{priority:9}
      }
    }
  };
  await writeJson(path.join(root,"bedrock/behavior_pack/entities/"+id+"_dragon.json"),bp);
  const client={
    format_version:"1.10.0",
    "minecraft:client_entity":{
      description:{
        identifier:entityId,materials:{default:"entity_alphatest"},
        textures:{default:"textures/entity/dragon_"+id},
        geometry:{default:"geometry.dragon_survival."+id},
        render_controllers:["controller.render.dragon_survival."+id],
        spawn_egg:{texture:"dragon_survival:"+id+"_dragon_spawn_egg"},
        animations:{
          [id+"_idle"]:"animation.dragon_survival."+id+".idle",
          [id+"_walk"]:"animation.dragon_survival."+id+".walk",
          [id+"_fly"]:"animation.dragon_survival."+id+".fly",
          [id+"_controller"]:"controller.animation.dragon_survival."+id
        },
        scripts:{animate:[id+"_controller"]}
      }
    }
  };
  await writeJson(path.join(root,"bedrock/resource_pack/entity/dragon_"+id+".entity.json"),client);
  itemAtlas.texture_data["dragon_survival:"+id+"_dragon_spawn_egg"]={textures:"textures/items/dragon_"+id+"_spawn_egg"};
  lang+="\nentity."+entityId+".name=Dragão de "+names[id];
  lang+="\nitem.spawn_egg.entity."+entityId+".name=Ovo de Invocação do Dragão de "+names[id];
}
await writeJson(path.join(root,"bedrock/resource_pack/textures/item_texture.json"),itemAtlas);
await writeFile(langFile,lang+"\n");
for(const file of ["bedrock/behavior_pack/manifest.json","bedrock/resource_pack/manifest.json"]){
  const manifest=JSON.parse(await readFile(path.join(root,file),"utf8"));
  manifest.header.version=[0,2,0];for(const module of manifest.modules)module.version=[0,2,0];
  if(file.includes("resource_pack"))manifest.dependencies[0].version=[0,2,0];
  await writeJson(path.join(root,file),manifest);
}
console.log("Gerados 15 entidades BP, 15 client entities, 15 geometrias, texturas, ovos, animações e controladores.");
