import superagent from 'superagent'
import { message } from 'antd';

let storage=window.localStorage;
export default class Superagent{
    static super(options){
        let tokenName=storage.getItem('tokenName')
        let loading;
        if(options.data && options.data.isShowLoading!==false){
            loading=document.getElementById('ajaxLoading')
            loading.style.display="block"
        }
        return new Promise((resolve,reject)=>{
            superagent
                .post(options.url)
                .type('form')
                .set("datamobile-token",tokenName)
                .query(options.query||'')
                .send(options.data||'')
                .end((req,res)=>{
                    if(options.data && options.data.isShowLoading!==false){
                        loading=document.getElementById('ajaxLoading')
                        loading.style.display="none"
                    } 
                    //console.log(res.body)
                    if(res.status===200){
                        resolve(res.body)
                    }else if(res.status===200){
                        message.info("请求权限不足,可能是token已经超时")
                    }else if(res.status===404||res.status===504){
                        message.info("页面不存在。")
                    }else if(res.status===500){
                        message.info("后台处理错误。")
                    }else{
                        reject(res.body)
                    }
                })              
        })
    }
}