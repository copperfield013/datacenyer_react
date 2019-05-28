import React from 'react'
import Super from "./../../super"
import Units from "./../../units"
import {Button,Icon,Popover,Input,Table,Modal, message,Collapse,Tag} from 'antd'
//import DragTable from './../DragTable'
import './index.css'
const {confirm} = Modal
const {Panel}=Collapse
const {CheckableTag}=Tag

export default class ModelImport extends React.Component{

    state={
        modelList:[],
        title:"",
        visible:false,
        dataSource:[],
    }
    componentDidMount(){
        const {menuId}=this.props
        this.loadWords(menuId)
    }
    loadWords=(menuId)=>{
        Super.super({
            url:`api2/entity/import/dict/${menuId}`,        
        }).then((res)=>{
            let selectWords=res.fieldDictionary.composites
            //console.log(selectWords)
            const forType=[]
            selectWords.map((item)=>{
                if(item.fields.length>0){
                    item.fields.map((it)=>{
                        it.checked=false
                        it.key=it.name
                        if(item.type==="relation"){
                            it.compositeId=item.id
                        }
                        const list={
                            type:item.type,
                            fieldId:it.id,
                        }
                        forType.push(list)
                        return false
                    })
                }
                return false
            })
            this.setState({
                selectWords,
                forType
            })
        })
    }
    switchTemplate=()=>{
        const {menuId}=this.props
        this.handleVisibleChange(true)
        Super.super({
            url:`api2/entity/import/tmpls/${menuId}`,        
        }).then((res)=>{
            if(res){
                this.setState({
                    modelList:res.tmpls,
                })
            }
        })
    }
    handelModel=(tmplId)=>{
        const {menuId}=this.props
        const {forType,selectWords}=this.state
        Super.super({
            url:`api2/entity/import/tmpl/${menuId}/${tmplId}`,        
        }).then((res)=>{
            console.log(res.tmpl.fields)
            if(res){
                selectWords.map((item)=>{
                    if(item.type==="normal"){
                        item.fields.map((it)=>{
                            let check=false
                            res.tmpl.fields.map((i)=>{
                                if(i.fieldId===it.id){
                                    check=true
                                }
                                return false
                            })
                            it.checked=check
                            return false
                        })
                    }
                    return false
                })
                let data=[]
                let type=""
                res.tmpl.fields.map((item)=>{
                    forType.map((it)=>{  //选择模板数据，添加type值
                        if(item.fieldId===it.fieldId){
                            type=it.type
                        }
                        return false
                    })
                    let list={
                        key:item.title,
                        name:item.title,
                        words:item.title,
                        fieldId:item.fieldId,
                        compositeId:item.compositeId,
                        id:item.id,
                        fieldIndex:item.fieldIndex,
                        type,
                    }
                    if(item.fieldId!==null){
                        list.totalname=item.title.split("[")[0]
                    }
                    data.push(list)
                    return false
                })
                this.setState({
                    tmplId:res.tmpl.id,
                    dataSource:data,
                    title:res.tmpl.title,
                    listLength:res.tmpl.fields.length,
                    selectWords
                })
                this.handleVisibleChange(false)
            }
        })
    }
    handleVisibleChange=(value)=>{
        this.setState({ visible:value });
    }
    handleSave=()=>{
        const {menuId}=this.props
        const {tmplId,title,dataSource}=this.state
        const fields=this.getFields(dataSource)  
        if(!title){
            message.error("请设置模板名称！")
            return
        }         
        Super.super({
            url:`api2/entity/import/save_tmpl/${menuId}`, 
            data:JSON.stringify({
                    tmplId,
                    title,
                    fields,
                })
        },"json").then((res)=>{
            if(res && res.status==="suc"){
                message.success("保存成功！")
                this.setState({
                    tmplId:res.tmplId,
                    listLength:dataSource.length,
                })
            }else{
                message.error("请选择字段保存！")
            }
        })
    }
    handleDownload=()=>{       
        const { tmplId,title,listLength,dataSource }=this.state
        if(dataSource.length!==listLength){
            message.info("请保存模板")
            return
        }
        const tokenName=Units.getLocalStorge("tokenName")
        if(tmplId){
            confirm({
                title: `确认下载`,
                content: `当前模板[${title}]，模板内共有${listLength}个字段`,
                okText: '是的',
                cancelText: '取消',
                onOk() {
                    return Units.downloadFile(`api2/entity/import/download_tmpl/${tmplId}?@token=${tokenName}`)               
                },
            }) 
        }else{
            message.info("请选择模板")
        }
    }
    setModelName=(e)=>{
        this.setState({
            title:e.target.value
        })
    }
    deleteRow=(record)=>{
        let {dataSource,selectWords}=this.state
        dataSource.map((item,i)=>{
            if(item.key===record.key){
                dataSource.splice(i,1)
            }
            return false
        })
        if(record.type==="normal"){           
            selectWords.map((item,i)=>{ //控制模板内tag是否选中
                if(item.fields.length>0){
                    item.fields.map((it)=>{
                        if(it.key===record.key){
                            it.checked=false
                        }
                        return false
                    })
                }
                return false
            })
        }else{
            let len=[]
            let labelarr=[]
            let data=[]
            dataSource.map((item)=>{
                if(item.fieldId===record.fieldId && !item.key.includes("label")){ 
                    len.push(item)
                }
                if(item.key.includes("label")){  
                    labelarr.push(item)
                }
                if(item.fieldId && !item.key.includes("label")){
                    data.push(item)
                }
                return false
            })
            len.map((item,i)=>{
                const NM=`${record.totalname}[${i}].${record.name.split(".")[1]}`
                item.key=NM
                item.name=NM
                item.words=NM
                item.fieldIndex=i
                return false
            })
            if(record.type==="relation"){ 
                let dele=true
                data.map((item)=>{
                    const dataTotal=item.key.split(".")[0]
                    const labelLastTotal=labelarr[labelarr.length-1].key.split(".")[0]                    
                    if(dataTotal===labelLastTotal){
                        dele=false
                    }
                    labelarr[labelarr.length-1].delete=dele                   
                    return false
                })
                if(data.length===0){
                    labelarr[labelarr.length-1].delete=true
                }          
                dataSource.map((item,i)=>{
                    if(item.delete){
                        dataSource.splice(i,1)
                    }
                    return false
                })
            }
        }
        this.setState({
            dataSource:Units.uniq(dataSource,"key"),
            selectWords,
        })
    }
    getWords=(list,type)=>{
        let {dataSource,selectWords}=this.state     
        if(type==="normal"){
            dataSource.push(list)        
            selectWords.map((item,i)=>{ //normal改变tag选中状态
                if(item.fields.length>0){
                    item.fields.map((it)=>{
                        if(it.key===list.key){
                            it.checked=true
                        }
                        return false
                    })
                }
                return false
            })
        }else{
            let len=[]
            dataSource.map((item)=>{
                if(item.fieldId===list.fieldId && !item.key.includes("label")){
                    len.push(item)
                }
                return false
            })
            const NM=`${list.totalname}[${len.length}].${list.name}`
            const res={
                fieldId:list.fieldId,
                key:NM,
                name:NM,
                words:NM,
                totalname:list.totalname,
                fieldIndex:len.length,
                type:list.type,
            }
            if(type==="relation"){
                const NLabel=`${list.totalname}[${len.length}].$$label$$`
                const labelRes={
                    key:NLabel,
                    name:NLabel,
                    words:NLabel,
                    fieldIndex:len.length,
                    totalname:list.totalname,
                    compositeId:list.compositeId
                }   
                dataSource.push(labelRes)
            }
            dataSource.push(res)
        }
        //console.log(dataSource)
        this.setState({
            dataSource:Units.uniq(dataSource,"key"),
            selectWords,
        })
    }
    getFields=(dataSource)=>{
        const fields=[]
        dataSource.map((item)=>{
            const list={}
            if(item.fieldIndex!==null){
                list.fieldIndex=item.fieldIndex
            }
            if(item.compositeId){
                list.compositeId=item.compositeId
            }
            if(item.fieldId){
                list.fieldId=item.fieldId
            }
            if(item.id){
                list.id=item.id
            }
            fields.push(list)
        })
        return fields
    }
    render(){
        const { visible,title,dataSource,selectWords,modelList,tmplId }=this.state
        //console.log(selectWords)
        const content = (
            <div>
                {modelList.map((item)=>{
                        return  <div key={item.id} className="modelList" onClick={()=>this.handelModel(item.id)}>
                                    <span className={tmplId===item.id?"light":""}><Icon type="bulb" style={{color:"#fff",fontSize:20}}/></span>
                                    <p className="tit">{item.title}</p>
                                    <p>{Units.formateDate(item.createTime)}</p>
                                </div>
                    })}
            </div>
        );
        const columns = [{
            title: '表头',
            key: 'name',
            width: 200,
            dataIndex:"name"
          }, {
            title: '字段',
            key: 'words',
            width: 200,
            dataIndex:"words"
          }, {
            title: '操作',
            key: 'action',
            render: (text, record) => (
                <Button 
                    style={{display:record.key.includes("label")?'none':'block'}} 
                    size='small' type="danger"
                     onClick={()=>this.deleteRow(record)}>
                    <Icon type="delete"/>
                </Button>
            ),
          }, ]
        return (
            <div className="selectModal">
                <h3>
                    导入模板配置
                    <p className="fr">
                        <Button className="hoverbig" title="新建模板"><Icon type="file-add" /></Button>                                                
                        <Button className="hoverbig" title="下载导入模板" onClick={this.handleDownload}><Icon type="download" /></Button>
                        <Button className="hoverbig" title="保存模板" onClick={this.handleSave}><Icon type="save" /></Button>
                        <Popover 
                            content={content} 
                            placement="bottomRight" 
                            trigger="click" 
                            visible={visible} 
                            onVisibleChange={this.handleVisibleChange}>
                            <Button 
                                className="hoverbig" 
                                title="切换模板" 
                                onClick={this.switchTemplate}
                                >
                                    <Icon type="snippets" />
                            </Button>
                        </Popover> 
                    </p>
                </h3>
                <div style={{marginBottom:20}}>
                    模板名称：
                    <Input placeholder="输入导入模板名称" style={{ width: 200 }} value={title} onChange={this.setModelName}/>
                </div>
                <div className="table">                   
                    <Table
                        bordered
                        columns={columns}
                        dataSource={dataSource}
                        size="small"
                        pagination={false}
                    />
                    {/* <DragTable
                        columns={columns}
                        dataSource={dataSource}
                        size="small"
                    
                    /> */}
                </div>
                {
                    selectWords?<Collapse accordion style={{float:"right"}}>
                                    {selectWords.map((item)=>{
                                        if(item.fields.length>0){
                                            return <Panel header={item.name} key={item.id}>
                                                        {item.fields.map((it)=>{
                                                            return <MyTag 
                                                                        key={it.name} 
                                                                        id={it.id}
                                                                        name={it.name}
                                                                        checked={it.checked}
                                                                        getwords={this.getWords}
                                                                        type={item.type}
                                                                        totalname={item.name}
                                                                        compositeid={it.compositeId}
                                                                        >{it.name}</MyTag>
                                                        })}
                                                    </Panel>
                                            
                                        }
                                        return false
                                    })}
                                </Collapse>:""
                }
            </div>
        )
    }
}

class MyTag extends React.Component {
    
    handleChange = (id,name) => {
      const {type,totalname,compositeid}=this.props
      const list={
        key:name,
        fieldId:id,
        name:name,
        words:name,
        totalname,
        type,
        compositeId:compositeid
      }
      this.props.getwords(list,type)
    };
    render() {
      const {name,id,checked}=this.props
      return (
        <CheckableTag {...this.props} onChange={()=>this.handleChange(id,name)} className={checked?"":"borderTag"}/>
      );
    }
  }