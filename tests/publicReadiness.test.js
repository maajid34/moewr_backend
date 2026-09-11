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
