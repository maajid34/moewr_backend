const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const request=require('supertest');
const mongoose=require('mongoose');
const gate=require('../middleWare/requireDatabaseReady');
for(const state of [0,1,2,3])test('public read readiness state '+state,async()=>{
 const original=Object.getOwnPropertyDescriptor(mongoose.connection,'readyState');
 Object.defineProperty(mongoose.connection,'readyState',{configurable:true,value:state});
 try{
 let queries=0;const app=express();app.get('/read',gate,(_req,res)=>{queries++;res.json({ok:true});});
 const result=await request(app).get('/read');
 assert.equal(result.status,state===1?200:503);assert.equal(queries,state===1?1:0);
 if(state!==1){assert.equal(result.headers['retry-after'],'30');assert.equal(result.body.message,'Database temporarily unavailable. Please try again shortly.');}
 }finally{if(original)Object.defineProperty(mongoose.connection,'readyState',original);else delete mongoose.connection.readyState;}
});

test('shared gate protects reads and writes across modules, then permits recovery', async () => {
 const original=Object.getOwnPropertyDescriptor(mongoose.connection,'readyState');
 let state=0;
 Object.defineProperty(mongoose.connection,'readyState',{configurable:true,get:()=>state});
 try {
  let calls=0;const app=express();app.use(gate);app.use((_req,res)=>{calls++;res.json({ok:true});});
  const paths=['/readProjectEnergy/EnergyProject','/readProjectWater/waterProject','/api/sumaryachievements','/readProjectEvent/Event','/api/activities','/api/assets','/api/employees','/api/attendance','/api/water-registry','/upload'];
  for(const path of paths) for(const method of ['get','post','patch','delete']) assert.equal((await request(app)[method](path)).status,503);
  assert.equal(calls,0);
  state=1;
  for(const path of paths) assert.equal((await request(app).get(path)).status,200);
  assert.equal(calls,paths.length);
 }finally{if(original)Object.defineProperty(mongoose.connection,'readyState',original);else delete mongoose.connection.readyState;}
});
