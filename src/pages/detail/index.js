import React from 'react'
import superagent from 'superagent'
import {Button,Modal,message,Icon,Drawer,Timeline,Switch,Popover,Card,Form} from 'antd'
import Super from "./../../super"
import Units from '../../units'
import './index.css'
import 'moment/locale/zh-cn';
import EditTable from './../../components/EditTable/editTable'
import FormCard from './../../components/FormCard'
import ModelForm from './../../components/ModelForm/modelForm'
import RightBar from './../../components/RightBar'
import BaseInfoForm from './../../components/BaseForm/BaseInfoForm'
import TemplateList from '../../components/templateList';
const confirm = Modal.confirm;

export default class Detail extends React.Component{
    state={
        visibleModal: false,
        visibleDrawer:false,
        loading:false,
        visibleExport:false,
        fuseMode:false,
        searchText:"",
        scrollIds:[],
        options:[],
        visibleForm:false,
        visibleTemplateList:false,
        isNew:false,
        records:[],
        optArr:[],
    }
    componentWillMount(){
        const {menuId,code,type}=this.props.match.params
        this.setState({
            menuId,
            type,
            code,
        })
        this.loadltmpl(menuId,code)
    }
    loadltmpl=(menuId,code)=>{
        Super.super({
            url:`/api2/meta/tmpl/dtmpl_config/normal/${menuId}/`,       
            data:{
                isShowLoading:true
            }          
        }).then((res)=>{     
            const formltmpl=[]
            const editformltmpl=[]
            const cardTitle=[]
            res.config.dtmpl.groups.map((item)=>{
                if(item.composite===null){
                    formltmpl.push(item)
                }else{
                    cardTitle.push(item.title)
                    editformltmpl.push(item)
                }
            })
            console.log(formltmpl)
            console.log(editformltmpl)
            this.requestSelect(formltmpl,editformltmpl)
            if(code){
                this.loadRequest(formltmpl,editformltmpl)
            }
            if(res.config.premises && res.config.premises.length>0){
                const result=[]
                res.config.premises.map((item)=>{
                    let list={}
                    for(let k in item){
                        list[k]=item[k]
                    }
                    list["title"]=item["fieldTitle"]
                    list["type"]="text"                    
                    list["value"]=item["fieldValue"]         
                    list["available"]=false
                    result.push(list)
                    return false
                })
                this.setState({
                    premises:result
                })  
            }
            this.setState({
                cardTitle,
                menuTitle:res.menu.title,
                actions:res.config.actions,
                formltmpl
            })
        })  
    }
    loadRequest=(formltmpl,editformltmpl)=>{
        const {menuId,type,code}=this.props.match.params
        this.setState({loading:true})
        Super.super({
            url:`/api2/entity/curd/detail/${menuId}/${code}`,       
            data:{
                isShowLoading:true
            }          
        }).then((res)=>{       
            formltmpl.map((item)=>{
                item.fields.map((item)=>{
                    for(let k in res.entity.fieldMap){
                        if(item.id.toString()===k){
                            item.value=res.entity.fieldMap[k]
                        }
                    }
                })
            })
            console.log(formltmpl)
            this.detailTitle(res.entity.title,type)
            this.setState({
                loading:false,
                actions:res.actions,
                formltmpl,
                editformltmpl,
                columns:this.renderColumns(editformltmpl),
                dataSource:res.entity.arrayMap,
            })          
        })
    }
    renderHistoryList=()=>{
        const {menuId,code,}=this.state
        Super.super({
            url:`/api2/entity/curd/history/${menuId}/${code}/1`,                
        }).then((res)=>{
            let detailHistory
            //console.log(res)
            if(res.history.length>0){
                detailHistory= res.history.map((item,index)=>{
                    const color=item.current?"red":"blue";
                    return <Timeline.Item color={color} key={index}>
                                {Units.formateDate(item.time)}<br/>
                                {`操作人`+item.userName}
                                {item.current?"":<Button 
                                                    style={{marginLeft:10}} 
                                                    code={item.code} 
                                                    type="primary" 
                                                    size="small" 
                                                    onClick={this.toHistory}
                                                    >查看</Button>
                                }                   
                            </Timeline.Item>
                    })
            }
            this.setState({
                detailHistory
            })
        })
    }
    toHistory=(e)=>{
        const {menuId,type}=this.state
        const historyCode=e.target.getAttribute("code");
        //console.log(historyCode)
        this.props.history.push(`/${menuId}/${type}/${historyCode}`)
        // Super.super({
        //     url:`/api2/entity/curd/detail/${menuId}/${historyCode}`,                
        // }).then((res)=>{
        //     const detailsList=res.entity.fieldGroups; 
        //     this.detailTitle(res,type)
        //     this.renderList(detailsList)
        //     if(res.history){                   
        //         const detailHistory=this.renderHistoryList(res.history);
        //         this.setState({
        //             detailHistory
        //         }) 
        //     }
        //     this.setState({loading:false})
        // })
    }
    detailTitle=(dataTitle,type)=>{
        const {menuTitle}=this.state
		let detailsTitle="";
		if(type==="detail"){
			detailsTitle=menuTitle+"-"+dataTitle+"-详情"
		}else if(type==="edit"){
			detailsTitle=menuTitle+"-"+dataTitle+"-修改"
		}			        		
		this.setState({ 
            detailsTitle,
            menuTitle,
		});
	}
    // renderList=(detailsList)=>{
    //     const itemDescs=[]
    //     const columns=[]
    //     const dataSource=[]
    //     const cardTitle=[]
    //     const formList=[] 
    //     const descsFlag=[]
    //     let scrollIds=[]
    //     detailsList.map((item)=>{
    //         if(item.descs){
    //             cardTitle.push(item.title)
    //             itemDescs.push(item)
    //             descsFlag.push(item.descs)
    //             columns.push(this.renderColumns(item))
    //             dataSource.push(this.requestTableList(item))
    //         }else if(item.fields){
    //             formList.push(item)
    //         }
    //         scrollIds.push(item.title)
    //         return false
    //     })
    //     this.requestSelect(formList,itemDescs)
    //     Units.setLocalStorge("scrollIds",scrollIds)
    //     this.setState({
    //         detailsList,
    //         formList,           
    //         itemDescs,
    //         columns,
    //         dataSource,
    //         cardTitle,
    //         descsFlag //为了加$$flag$$
    //     })
    //     this.handleNav(scrollIds)
    // }
    renderColumns=(editformltmpl)=>{
        const {type}=this.state 
        const columns=[]
        editformltmpl.map((item)=>{
            const totalName=item.title
			item.fields.map((item,index)=>{
                const id=item.id
                item["dataIndex"]=id;	
                item["key"]=index;                
                if(type==="detail"){
                    if(item.type==="decimal"){
                        item["sorter"]=(a, b) => a[id] - b[id]; 
                    }else{
                        item["sorter"]=(a, b) => a[id].length - b[id].length; 
                    }
                }           
                return false      					
            })  
            if(item.composite && item.composite.addType===5){//判断是否有关系属性
                let rela={
                    dataIndex:`${totalName}.关系`,
                    fieldName:"关系",
                    title:"关系",
                    type:"relation",
                    available:true,
                    options:item.composite.relationSubdomain
                }
                item.fields.unshift(rela) 
            }      
            const order={
                title: '序号',
                key: 'order',
                width:65,
                dataIndex:'key',
                render: (text, record,index) => (
                    <label>{index+1}</label>
                    ),
            } 
            item.fields.unshift(order)
            if(type==="edit"){
                const act={
                    title: '操作',
                    key: 'action',
                    render: (record) => (
                    <div className="editbtn">
                        <Button type='primary' icon="edit" size="small"  onClick={()=>this.visibleForm(item.descs,record)}></Button>
                        <Button type='danger' icon="delete" size="small" onClick={()=>this.removeList(record)}></Button>
                    </div>
                    ),
                }  
                item.fields.push(act) 
            }
            columns.push(item)
        })   
        return columns
    }
    requestSelect=(formltmpl,editformltmpl)=>{
        const { type }=this.state; 
        const selectId=[]
        if(type==="edit" || type==="new"){
            formltmpl.map((item)=>{
                item.fields.map((it)=>{
                    if(it.type==="select" || it.type==="label"){
                        selectId.push(it.fieldId)
                    }
                    return false
                })
                return false
            })
            editformltmpl.map((item)=>{ 
                item.fields.map((it)=>{
                    if(it.type==="select"){
                        selectId.push(it.fieldId)
                    }
                    return false
                })
                return false
            })
        if(selectId.length>0){  //有下拉框时，发送请求
            let fieldIds = ""
            selectId.map((item)=>{
                fieldIds+=item+","
                return false
            })
            Super.super({
                url:`/api2/meta/dict/field_options`,       
                data:{
                    fieldIds
                },
            }).then((res)=>{
                this.setState({
                    optionsMap:res.optionsMap
                })
            })
            // superagent
            //     .post(`/api2/meta/dict/field_options`)
            //     .set({"datacenter-token":tokenName})
            //     .send(formData)
            //     .end((req,res)=>{
            //         if(res.status===200){                                          
            //             optArr.push(res.body.optionsMap)
            //             this.setState({
            //                 optArr
            //             })
            //         }else if(res.status===403){
            //             message.info("请求权限不足,可能是token已经超时")
            //             window.location.href="/#/login";
            //         }else if(res.status===404||res.status===504){
            //             message.info("服务器未开···")
            //         }else if(res.status===500){
            //             message.info("后台处理错误。")
            //         }
            //         //console.log(optArr)
            //     })
            }
        }
    }
    // removeList=(record)=>{
    //     const deleKey=record.key
    //     const dataSource =[...this.state.dataSource];      
    //     const newDataSource=[]
    //     const records=[]
    //     dataSource.map((item)=>{
    //         const newData=[]
    //         item.map((it)=>{
    //             if(it.key!==deleKey){
    //                 newData.push(it)
    //             }
    //             return false
    //         })
    //         newData.map((item,index)=>{ //删除行，更改数字标签
    //             let list={}
    //             let ins=newData.indexOf(item)
    //             for(let k in item){
    //                 let nk=k.replace(/\[.*?\]/g,`[${index}]`)
    //                 list[nk]=item[k]
    //             }
    //             newData.splice(ins, 1,list)
    //             return false
    //         })
    //         newDataSource.push(newData)           
    //         return false
    //     })
    //     newDataSource.map((item)=>{
    //         item.map((it)=>{
    //             let list={}
    //             for(let k in it){
    //                 if(k.indexOf("[")>-1 && it[k].indexOf("download-files")===-1){ //去除key，total，object，fieldName
    //                     list[k]=it[k]
    //                 }
    //             }
    //             records.push(list)
    //             return false
    //         })
    //         return false
    //     })
    //     //console.log(newDataSource)
    //     this.setState({
    //         dataSource:newDataSource,
    //         records,
    //     })
    // }
    // requestTableList=(data)=>{
    //     const {type}=this.state
    //     const res=[]              
    //     console.log(data)
    //     if(data && type!=="new"){
    //         data.map((item,index)=>{
    //             const list={};   
    //             const code=item.code;
    //             let fieldName=""
    //             list["key"]=code;       
    //             if(item.relationLabel){
    //                 list["关系"]=item.relationLabel;
    //                 list["fieldName"]="关系";
    //                 list["title"]="关系";
    //                 list["type"]="relation";
    //                 list["value"]=item.relationLabel;
    //                 list["options"]=data.composite.relationSubdomain
    //             }
    //             fieldsArray.map((it)=>{
    //                 fieldName=it.fieldName
    //                 const fieldValue=it.value;     
    //                 const fieldType=it.type;                
    //                 const a=fieldName.split(".")[0]
    //                 const b=fieldName.split(".")[1];
    //                 if(fieldType==="file"){
    //                     list[fieldName]=fieldValue?
    //                     <span className="downEditPic">
    //                         <img style={{width:55}} src={`/file-server/${fieldValue}`} alt="图片加载失败"/>
    //                         <Button size="small" href={`/file-server/${fieldValue}`} download="logo.png"><Icon type="download"/></Button>
    //                     </span>
    //                     :"无文件"
    //                 }else{
    //                     list[fieldName]=fieldValue?fieldValue:"";
    //                 } 
    //                 list[a+`[${index}].唯一编码`]=code;
    //                 list[a+`[${index}].`+b]=fieldValue?fieldValue:"";
    //                 if(data.composite.relationKey){
    //                     list[a+`[${index}].$$label$$`]=item.relation;    
    //                     list[a+".关系"]=relation
    //                 }
    //                 return false
    //             })
    //             res.push(list) 
    //             return false             
    //         })        
    //     }
    //     return res
    // }
    showHistory=()=>{
        this.renderHistoryList();
        // console.log(detailHistory)
        this.setState({
            visibleDrawer: true,
            //detailHistory
        });
    }
    // handleOk = (e) => {
    //     e.preventDefault();
    //     this.setState({loading:true})
    //     const tokenName=Units.getLocalStorge("tokenName")
    //     const formData = new FormData();
    //     const { menuId,code,type,records,baseValue,fuseMode,descsFlag }=this.state
    //     formData.append('唯一编码', type==="new"?"":code);
    //     formData.append('%fuseMode%',fuseMode);
    //     for(let k in baseValue){
    //         formData.append(k, baseValue[k]?baseValue[k]:"");
    //     }
    //     descsFlag.map((item)=>{ //添加$$flag$$
    //         item.map((it)=>{
    //             const fieldName=it.fieldName;
    //             if(fieldName && fieldName!=="关系"){               
    //                 const list={}
    //                 const a=fieldName.split(".")[0]
    //                 list[`${a}.$$flag$$`]=true;
    //                 records.push(list)
    //             }
    //             return false
    //         })
    //         return false
    //     })
    //     let res={}
    //     records.map((item)=>{
    //         for(let k in item){
    //             res[k]=item[k] //去重
    //         }          
    //         return false
    //     })  
    //     if(res){
    //         for(let k in res){
    //             formData.append(k, res[k]);
    //         }
    //     }
    //     const loading=document.getElementById('ajaxLoading')
    //     loading.style.display="block"
    //     superagent
    //         .post(`/api/entity/curd/update/${menuId}`)
    //         .set({"datamobile-token":tokenName})
    //         .send(formData)
    //         .end((req,res)=>{
    //             loading.style.display="none"
    //             if(res.status===200){                   
    //                 if(res.body.status==="suc"){
    //                     message.info("保存成功！")
    //                     sessionStorage.setItem(menuId,"")
    //                     window.history.back(-1);
    //                 }else{
    //                     message.error(res.body.status)
    //                 }
    //             }else if(res.status===403){
    //                 message.info("请求权限不足,可能是token已经超时")
    //                 window.location.href="/#/login";
    //             }else if(res.status===404||res.status===504){
    //                 message.info("服务器未开···")
    //             }else if(res.status===500){
    //                 message.info("后台处理错误。")
    //             }
    //         })
    //     this.setState({
    //         visibleModal: false,
    //         loading:false
    //     });
    //   }
    exportDetail=()=>{
        const {menuId,code}=this.state
        confirm({
            title: '确认导出当前详情页？',            
            okText: "确认",
            cancelText: "取消",
            onOk() {
                const loading=document.getElementById('ajaxLoading')
                loading.style.display="block"
                Super.super({
                    url:`/api2/entity/export/detail/${menuId}/${code}`,                 
                }).then((res)=>{
                    loading.style.display="none"
                    if(res.status==="suc"){
                        Units.downloadFile(`/api2/entity/export/download/${res.uuid}`)
                    }else{
                        message.error(res.status)
                    }
                })
            },
          });          
    }
    handleCancel = () => {
        this.setState({
            visibleModal: false,
            visibleForm: false,
            visibleTemplateList:false,
            visibleDrawer: false,
        });
    }
    // getRecords=()=>{
    //     const dataSource =[...this.state.dataSource];
    //     const {records}=this.state
    //     dataSource.map((item)=>{
    //         item.map((it)=>{
    //             let list={}
    //             for(let k in it){
    //                 if(k.indexOf("[")>-1&& k.split(".")[1]!=="关系"){
    //                     if(typeof it[k]==="object"){ //图片，取自定义的owlner属性
    //                         if(it[k].props.owlner){
    //                             list[k]=it[k].props.owlner
    //                         }else{
    //                             delete it[k]
    //                         }
    //                     }else if(typeof it[k]==="string" && it[k].indexOf("download-files")>-1){
    //                         delete it[k]
    //                     }else{
    //                         list[k]=it[k]
    //                     }
    //                 }
    //             }
    //             records.push(list)
    //             return false
    //         })
    //         return false
    //     })
    //     let isOK=true   
    //     let res={}  
    //     records.map((item)=>{
    //         for(let k in item){
    //             res[k]=item[k] //去重
    //         }
    //         return false
    //     })
    //     for(let k in res){//判断新增记录，关系有没有选
    //         if(k.indexOf("$$label$$")>-1 && res[k]===""){
    //             isOK=false
    //         }
    //     }
    //     if(isOK){
    //         this.setState({
    //             records,
    //             visibleModal: true,
    //         })
    //     }else{           
    //         message.error("关系列表未选！")
    //     }
    // }
    // showModal = () => {
    //     this.baseinfo.handleBaseInfoSubmit() //获取BaseInfo数据
    //     this.getRecords()
    // }   
    // baseInfo=(baseValue)=>{         
    //     this.setState({
    //         baseValue
    //     });
    // }
    //调用子组件方法
	onRef=(ref)=>{
		this.baseinfo=ref
    }
    onRef2=(ref)=>{
		this.modelform=ref
    }
    // fuseMode=(checked)=>{
    //     this.setState({
    //         fuseMode:checked
    //     })
    // }
    // handleNav=(scrollIds)=>{
    //     const list=document.getElementsByClassName("rightBar")[0]
    //     if(list){
    //         const lis=list.getElementsByTagName("li")
    //         for(let i=0;i<lis.length;i++){
    //             lis[i].style.backgroundColor="#fff"
    //         }
    //         lis[0].style.backgroundColor="#cfe3f5"
    //     }
    // } 
    getOptions=(id)=>{  
        const {optionsMap}=this.state
        if(optionsMap){
            for(let k in optionsMap){
                if(k===id.toString()){      
                    this.setState({
                        options:optionsMap[k]
                    })
                }
            }
        }        
    }
    // visibleForm=(data,record)=>{
    //     this.getForm(data,record)
    //     this.setState({
    //         visibleForm:true,
    //     })
    // }
    // modelhandleOk=(fieldsValue)=>{    
    //     const key=fieldsValue.key;
    //     const totalName=fieldsValue.totalName;
    //     let { dataSource,isNew,columns }=this.state;
    //     if(isNew){ //新增记录
    //         let i="";
    //         columns.map((item,index)=>{ //得知第几个数组新增
    //             item.map((it)=>{
    //                 for(let k in it){
    //                     if(typeof it[k]==="string" && it[k].indexOf(totalName)>-1){
    //                         i=index
    //                     }
    //                 }
    //                 return false
    //             })
    //             return false
    //         })
    //         const list={}
    //         list["key"]=key;
    //         for(let k in fieldsValue){
    //             if(k!=="key" && k!=="totalName"){
    //                 list[`${totalName}.${k}`]=fieldsValue[k];
    //                 list[`${totalName}[${dataSource[i].length}].${k}`]=fieldsValue[k];
    //             }
    //             if(k==="关系"){
    //                 list[`${totalName}[${dataSource[i].length}].$$label$$`]=fieldsValue[k];
    //             }
    //         }
    //         dataSource[i].push(list)
    //     }else{     //修改记录  
    //         dataSource.map((item)=>{
    //             item.map((it)=>{
    //                 if(it.key===key){
    //                     for(let k in fieldsValue){                      
    //                         for(let ki in it){
    //                             if(ki.indexOf(k)>-1){
    //                                 it[ki]=fieldsValue[k]
    //                             }
    //                             const va=fieldsValue["关系"]
    //                             if(ki.indexOf("label")>-1){
    //                                 it[ki]=va?va:""
    //                             }
    //                             if(ki.split(".")[1]==="关系"){
    //                                 it[ki]=va?va:""
    //                             }
    //                         }
    //                     }
    //                 }
    //                 return false
    //             })
    //             return false
    //         })
    //     }
    //     this.setState({
    //         dataSource,
    //         visibleForm:false
    //     })
    // }
    // getForm=(columns,record)=>{
    //     this.modelform.handleReset()
    //     let editFormList=[]
    //     columns.map((item)=>{
    //         if(item.type){
    //             const list={}
    //             list["title"]=item.title;
    //             list["fieldName"]=item.fieldName;                
    //             list["available"]=item.available;
    //             if(record){
    //                 this.setState({
    //                     isNew:false,
    //                     title:"修改",
    //                 })
    //                 list["key"]=record["key"]
    //                 for(let k in record){
    //                     if(k.indexOf(item.fieldName)>-1){
    //                         let value=""
    //                         if(typeof record[k]==="object"){ 
    //                             if(record[k].props.children){                                               
    //                                 record[k].props.children.map((item)=>{ 
    //                                     if(item.props.src){
    //                                         value=item.props.src.split("/.")[1]//多了file-server/
    //                                     }
    //                                     return false
    //                                 })
    //                             }else{
    //                                 value=record[k].props.src.split("/.")[1]
    //                             }
    //                             list["value"]=value
    //                         }else{
    //                             list["value"]=record[k]
    //                         }    
    //                     }
    //                 }
    //             }else{
    //                 this.setState({
    //                     isNew:true,
    //                     title:"新增",
    //                 })
    //                 list["value"]="";
    //             }
    //             list["type"]=item.type;
    //             list["fieldId"]=item.fieldId;              
    //             list["available"]=item.available;
    //             if(item.type==="relation"){
    //                 const options=[]
    //                 item.options.map((it)=>{
    //                     const op={}
    //                     op["title"]=it
    //                     op["value"]=it
    //                     options.push(op)
    //                     return false
    //                 })
    //                 list["options"]=options
    //             }
    //             editFormList.push(list)
    //         }
    //         return false
    //     })
    //     //console.log(editFormList)
    //     //console.log(columns)
    //     this.setState({
    //         editFormList,
    //         visibleForm:true,
    //     })
    // }
    // handleActions=(actionId)=>{
    //     const {menuId,code}=this.state;
    //     this.setState({Loading:true})
    //     Super.super({
    //         url:`/api/entity/curd/do_action/${menuId}/${actionId}`, 
    //         data:{
    //             codes:code
    //         }                 
    //     }).then((res)=>{
    //         this.setState({Loading:false})
    //         if(res && res.status==="suc"){
    //             message.info(res.msg)
    //             sessionStorage.setItem(menuId,"")
    //             window.history.back(-1);
    //         }else{
    //             message.error(res.status)
    //         }
    //     })
    // }
    // getTemplate=(stmplId,columns,pageNo,oexcepts,oopti)=>{
    //     let {menuId,fields,excepts,opti}=this.state;
    //     if(!excepts){
    //         excepts=oexcepts
    //     }        
    //     if(excepts && excepts!==oexcepts){
    //         excepts=oexcepts
    //     }
    //     if(!opti){
    //         opti=oopti
    //     }
    //     Super.super({
    //         url:`/api/entity/curd/selections/${menuId}/${stmplId}`,  
    //         data:{
    //             pageNo,
    //             excepts,
    //         }                
    //     }).then((res)=>{
    //         let newfields=""
    //         if(columns){
    //             columns.map((item)=>{
    //                 if(item.fieldId){
    //                     newfields+=item.fieldName+","
    //                 }
    //                 return false
    //             })
    //             if(!fields){
    //                 fields=newfields
    //             }
    //             if(fields && fields!==newfields){
    //                 fields=newfields
    //             }
    //         }
    //         if(res){
    //             this.setState({
    //                 visibleTemplateList:true,
    //                 templateData:res,
    //                 stmplId,
    //                 fields,
    //                 excepts,
    //                 opti,
    //             })
    //         }else{
    //             message.error("无数据")
    //         }
    //     })
    // }
    // TemplatehandleOk=(value)=>{
    //     let {fields,dataSource,columns,opti}=this.state
    //     const totalName=fields.split(".")[0];
    //     const key=[]
    //     for(let k in value){
    //         key.push(k)
    //     }
    //     let i="";
    //     columns.map((item,index)=>{ //得知第几个数组新增
    //         item.map((it)=>{
    //             for(let k in it){
    //                 if(typeof it[k]==="string" && it[k].indexOf(totalName)>-1){
    //                     i=index
    //                 }
    //             }
    //             return false
    //         })
    //         return false
    //     })
    //     key.map((item)=>{
    //         const list={}
    //         list["key"]=item;
    //         list[`${totalName}.关系`]=opti?opti:"";
    //         list[`${totalName}[${dataSource[i].length}].$$label$$`]=opti?opti:"";
    //         for(let k in value[item]){
    //             if(k!=="key" && k!=="唯一编码"){
    //                 const ssr1=k.split(".")[0]
    //                 const ssr2=k.split(".")[1]
    //                 list[k]=value[item][k];
    //                 list[`${ssr1}[${dataSource[i].length}].${ssr2}`]=value[item][k];
    //             }else if(k==="唯一编码"){
    //                 list[`${totalName}[${dataSource[i].length}].唯一编码`]=value[item][k];
    //             }
    //             if(value[item][k].indexOf("download-files")>-1){
    //                 list[k]=<img 
    //                             style={{width:55}} 
    //                             src={`/file-server/${value[item][k]}`} 
    //                             alt="" />
    //             }
    //         }
    //         dataSource[i].push(list)
    //         return false
    //     })
    //     // console.log(dataSource)  
    //     // console.log(value)        
    //     this.setState({
    //         dataSource,
    //     })
        
    // }
    render(){
        const { menuTitle,detailsTitle,fuseMode,formltmpl,loading,detailsList,visibleForm,editFormList,actions,premises,templateData,stmplId,
            columns,dataSource,cardTitle,itemDescs,visibleModal,visibleDrawer,detailHistory,type,menuId,code,visibleTemplateList,fields,editformltmpl
        }=this.state;
        let premisestitle=""
        if(premises && premises.length>0){
            premisestitle=type==="detail"?"默认字段":"默认字段（不可修改）"
            formltmpl.map((item)=>{
                item.fields.map((it)=>{
                    premises.map((i)=>{
                        if(i.fieldName===it.fieldName){
                            it.available=false
                            it["value"]= i["value"]
                        }
                        return false
                    })
                    return false
                })
                return false
            })
        }
        let content
        if(actions && actions.length>0){
            content = (
                <div className="btns">
                  {
                      actions.map((item)=>{
                          return <Button key={item.id} type="primary" onClick={()=>this.handleActions(item.id)}>{item.title}</Button>
                      })
                  }
                </div>
            );
        } 
        const list=[]
        if(premises){
            list.push("默认字段")
        }
        if(formltmpl){
            formltmpl.map((item)=>{
                list.push(item.title)
                return false
            })          
        }
        if(cardTitle){
            list.push(...cardTitle)
        }
        return(
            <div className="detailPage">
                <h3>
                    {
                        type==="new"&& menuTitle ? menuTitle+"--创建":detailsTitle
                    }   
                    {
                        type==="detail"?
                        <div className="fr pad">
                            <Button className="hoverbig" title="导出" onClick={this.exportDetail}><Icon type="upload" /></Button>
                            <Button className="hoverbig" title="查看历史" onClick={this.showHistory}><Icon type="schedule" /></Button>                                                      
                            <Button className="hoverbig" title="刷新" onClick={()=>this.loadltmpl(menuId,code)}><Icon type="sync" /></Button>
                        </div>
                        :
                        <div className="fr pad">
                            <div className="buttonGroup">
                            {
                                actions?
                                <Popover placement="leftTop" content={content} trigger="click">
                                    <Button>
                                        <Icon type="swap" />
                                    </Button>
                                </Popover>:""
                            }
                            <Button 
                                type='primary' 
                                icon="cloud-upload" 
                                className="submitBtn" 
                                key="btn" 
                                onClick={this.showModal} 
                                style={{background:fuseMode===true?"#001529":""}}>
                                保存
                            </Button>
                            </div>
                            <Switch checkedChildren="开" unCheckedChildren="关" style={{marginRight:10}} title="融合模式" onChange={this.fuseMode}/>
                            <Button className="hoverbig" title="刷新" onClick={()=>this.loadltmpl(menuId,type,code)}><Icon type="sync" /></Button>
                        </div>
                    }               
                    
                </h3>
                {
                    premises && premises.length>0?<Form layout="inline" autoComplete="off">  
                                <Card 
                                    title={premisestitle} 
                                    key={premisestitle} 
                                    id={premisestitle}
                                    className="hoverable" 
                                    headStyle={{background:"#f2f4f5"}}
                                    loading={loading}
                                    >
                                    <BaseInfoForm 
                                        key={111}
                                        formList={premises} 
                                        type="detail"
                                        //form={form}
                                        width={220}
                                        />
                                </Card>
                            </Form>
                                :""
                }
                <FormCard
                    formList={formltmpl}
                    type={type}
                    baseInfo={this.baseInfo}
                    loading={loading}
                    onRef={this.onRef}
                    getOptions={this.getOptions}
                    options={this.state.options}
                />
                <EditTable 
                    detailsList={detailsList}
                    type={type}
                    columns={columns}
                    dataSource={dataSource}
                    cardTitle={cardTitle}
                    itemDescs={itemDescs}
                    handleAdd={this.getForm}
                    onRef3={this.onRef3}
                    getTemplate={this.getTemplate}
                />
                <Modal
                    visible={visibleModal}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    okText="确认"
                    cancelText="取消"
                    >
                    <p>确认提交数据吗？</p>
                </Modal>               
                <ModelForm
                    handleCancel={this.handleCancel}
                    handleOk={this.modelhandleOk}
                    visibleForm={visibleForm}
                    formList={editFormList}
                    type="edit"                       
                    getOptions={this.getOptions}
                    options={this.state.options}
                    onRef2={this.onRef2}
                    title={this.state.title}
                />
                <Drawer
                    title="查看历史"
                    closable={false}
                    onClose={this.handleCancel}
                    visible={visibleDrawer}
                    width={400}
                    >
                    {detailHistory?<Timeline mode="alternate">
                        {detailHistory}
                    </Timeline>:"暂无历史记录"}
                </Drawer>
                <TemplateList 
                    visibleTemplateList={visibleTemplateList}
                    handleCancel={this.handleCancel}
                    templateData={templateData}
                    width={680}
                    stmplId={stmplId}
                    menuId={menuId}
                    getTemplate={this.getTemplate}
                    fields={fields}
                    TemplatehandleOk={this.TemplatehandleOk}
                />
                {
                    !cardTitle||cardTitle.length<=3?"":
                    <RightBar 
                        list={list}
                    />
                }
                
            </div>
        )
    }
}
