import React from 'react'
import {Card,Button,Modal,message,Icon,Drawer,Timeline,Switch} from 'antd'
import Super from "./../../super"
import Units from './../../units/unit'
import './index.css'
import 'moment/locale/zh-cn';
import EditTable from './../../pages/EditTable/editTable'
import BaseInfoForm from './../../components/BaseForm/BaseInfoForm'

let storage=window.sessionStorage;
let totalcode=[]
export default class Detail extends React.Component{
    state={
        count:0,
        visibleModal: false,
        visibleDrawer:false,
        loading:false,
    }
    componentWillMount(){
        this.requestLists()
        totalcode=[] //切换清空原有数据
    }
    requestLists=()=>{
        if(!this.props.code){
            console.log("无效的模板")
            return
        }
        this.setState({loading:true})
        let typecode=this.props.type+this.props.code;		
        if(!storage[typecode]){//判断是否存储数据
            //console.log("未存")
            let menuId=this.props.menuId;
            let code=this.props.code;
            Super.super({
                url:`/api/entity/detail/${menuId}/${code}`,                 
            }).then((res)=>{
                //console.log(res)
                storage[typecode]=JSON.stringify(res); //存储一条数据
                let detailsList=res.entity.fieldGroups; 
                this.toDetails(res,this.props.type)
                this.renderList(detailsList)
                if(res.history){                   
                    let detailHistory=this.renderHistoryList(res.history);
                    this.setState({
                        detailHistory
                    }) 
                }
                this.setState({loading:false})
            })
        }else{  
            //console.log("已存") 
            let data=JSON.parse(storage[typecode]);
            let detailsList=data.entity.fieldGroups;
            this.renderList(detailsList)
            this.toDetails(data,this.props.type) 
            if(data.history){
                let detailHistory=this.renderHistoryList(data.history);
                this.setState({
                    detailHistory
                })
            }
            this.setState({loading:false})          
        }               
    }
    renderHistoryList=(data)=>{
		return data.map((item,index)=>{
            let color=item.current?"red":"blue";
			return <Timeline.Item color={color} key={index}>
                        {Units.formateDate(item.time)}<br/>
                        {`操作人`+item.userName}
                        {
                          item.current?"":<Button style={{marginLeft:10}} id={item.id} type="primary" size="small" onClick={this.toHistory}>查看</Button>
                        }                   
				    </Timeline.Item>
		})
    }
    toHistory=(e)=>{
        this.setState({loading:true})
        let historyId=e.target.getAttribute("id");
        let menuId=this.props.menuId;
        let code=this.props.code;
        Super.super({
            url:`/api/entity/detail/${menuId}/${code}`,  
            data:{
                historyId,
            }                 
        }).then((res)=>{
            let detailsList=res.entity.fieldGroups; 
            this.toDetails(res,this.props.type)
            this.renderList(detailsList)
            if(res.history){                   
                let detailHistory=this.renderHistoryList(res.history);
                this.setState({
                    detailHistory
                }) 
            }
            this.setState({loading:false})
        })

    }
    toDetails=(data,type)=>{
		let detailsTitle="";
		let moduleTitle=data.module.title;
		let entityTitle=data.entity.title;
		//console.log(detailsList)
		if(type==="detail"){
			detailsTitle=entityTitle?moduleTitle+"-"+entityTitle+"-详情":moduleTitle+"-详情";
		}else{
			detailsTitle=entityTitle?moduleTitle+"-修改-"+entityTitle:moduleTitle+"-修改";
		}			
		this.setState({ 
            detailsTitle,
            moduleTitle,
		});
	}
    renderList=(detailsList)=>{
        //console.log("渲染")       
        let itemDescs=[]
        let columns=[]
        let dataSource=[]
        let cardTitle=[]
        let formList=detailsList[0].fields;    
        let firstCard=""          
        detailsList.map((item)=>{
            if(item.descs){
                cardTitle.push(item.title)
                itemDescs.push(item.descs)
                columns.push(this.renderColumns(item.descs))
                dataSource.push(this.requestTableList(item))
            }else if(item.fields){
                firstCard=item.title
            }     
            return false
        })   
        this.setState({
            detailsList,
            formList,           
            itemDescs,
            columns,
            dataSource:this.props.flag?[]:dataSource,
            cardTitle,
            firstCard,
        })
    }
    renderColumns=(data)=>{
		if(data){
			data.map((item,index)=>{
                let fieldName=item.fieldName;
                item["dataIndex"]=fieldName;	
                item["key"]=index; 
                return false      					
            })
            //console.log(data)
            return data
		}		
    }
    requestTableList=(data)=>{
        let res=[]
        this.setState({
            count :this.state.count+data.array.length
        })
        if(data.array){
            data.array.map((item)=>{
                let code=item.code;
                let list={};              
                item.fields.map((it,index)=>{
                    let fieldName=it.fieldName;
                    let fieldValue=it.value;
                    list["key"]=index+code;
                    list["code"]=code;
                    list[fieldName]=fieldValue;
                    return false
                })
                res.push(list) 
                //console.log(res)
                return false             
            })
            return res        
        }
    }
    showHistory=()=>{
        this.setState({
            visibleDrawer: true,
        });
    }
    onClose = () => {
        this.setState({
            visibleDrawer: false,
        });
    }
    fresh=()=>{
        console.log("刷新")
        this.child.reSet() //重置baseInfoForm
        this.children.initDetailsList()//无效，待解决
    }
    handleOk = (e) => {
        e.preventDefault();
        this.setState({loading:true})
        this.child.handleBaseInfoSubmit()
        let records=[]
        let menuId=this.props.menuId;
        let code=this.props.code;          
        let baseInfo={}
        let newRecord={}
        if(storage.getItem("baseInfo")){
            baseInfo=JSON.parse(storage.getItem("baseInfo"))
        }
        totalcode.map((item)=>{
            if(storage.getItem(item)){
                let record=JSON.parse(storage.getItem(item))
                delete(record.key)//删除不必要传递的key
                records.push(record)
            }
            return false
        })
        if(storage.getItem("newRecord")){
            newRecord=JSON.parse(storage.getItem("newRecord"))
        }
        let values=Object.assign(baseInfo, ...records, newRecord)
        console.log(values)
        Super.super({
            url:`/api/entity/update/${menuId}`,  
            data:{
                "唯一编码":code,
                ...values,
            }                 
        }).then((res)=>{
            console.log(res)
            this.setState({loading:false})
            message.success("提交成功！")
        })
        this.setState({
            visibleModal: false,
        });
      }
    
    handleCancel = () => {
        this.setState({
            visibleModal: false,
        });
    }
    showModal = () => {
        this.setState({
            visibleModal: true,
        });
    }
    //调用子组件方法
	onRef=(ref)=>{
		this.child=ref
    }
    onRef2=(ref)=>{
		this.children=ref
    }
    callbacktotalcode=(data)=>{
        totalcode=data
    }
    scrollToAnchor = (anchorName) => {
        if (anchorName) {
            let anchorElement = document.getElementById(anchorName);
            if(anchorElement) { anchorElement.scrollIntoView({behavior: 'smooth'})}
        }
      }
    render(){
        return(
            <div>
                <h3>
                    {
                        this.props.flag?this.state.moduleTitle+"--创建":this.state.detailsTitle
                    }   
                    {
                        this.props.type==="detail"?
                        <div className="fr">
                            <Button className="hoverbig" title="导出"><Icon type="upload" /></Button>
                            <Button className="hoverbig" title="查看历史" onClick={this.showHistory}><Icon type="schedule" /></Button>                                                      
                            <Button className="hoverbig" title="刷新" onClick={this.fresh}><Icon type="sync" /></Button>
                        </div>
                        :
                        <div className="fr">
                            <Button type='primary' icon="cloud-upload" className="submitBtn" onClick={this.showModal} key="btn">提交</Button>
                            <Switch checkedChildren="开" unCheckedChildren="关" style={{marginRight:10}} title="融合模式"/>
                            <Button className="hoverbig" title="刷新" onClick={this.fresh}><Icon type="sync" /></Button>
                        </div>
                    }               
                    
                </h3> 
                <Card title={this.state.firstCard} 
                    id={this.state.firstCard} 
                    className="hoverable" 
                    headStyle={{background:"#f2f4f5"}}
                    loading={this.state.loading}
                    >
                    <BaseInfoForm 
                        formList={this.state.formList} 
                        type={this.props.type} 
                        onRef={this.onRef}
                        flag={this.props.flag}
                        />
                </Card>
                <EditTable 
                    detailsList={this.state.detailsList}
                    type={this.props.type}
                    columns={this.state.columns}
                    dataSource={this.state.dataSource}
                    count={this.state.count}
                    cardTitle={this.state.cardTitle}
                    itemDescs={this.state.itemDescs}
                    callback={this.callbacktotalcode}
                    onRef2={this.onRef2}
                />
                <Modal
                    visible={this.state.visibleModal}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    okText="确认"
                    cancelText="取消"
                    >
                    <p>确认提交数据吗</p>
                </Modal>
                <Drawer
                    title="查看历史"
                    closable={false}
                    onClose={this.onClose}
                    visible={this.state.visibleDrawer}
                    width={400}
                    >
                    <Timeline mode="alternate" pending="没有更多了...">
                        {this.state.detailHistory}
                    </Timeline>
                </Drawer>
                <div className="rightBar">
                    <ul>
                        <li onClick={()=>this.scrollToAnchor(this.state.firstCard)} key={this.state.firstCard}>
                            {this.state.firstCard}
                        </li>
                        {
                            this.state.cardTitle?
                            this.state.cardTitle.map((item)=>{
                                return <li onClick={()=>this.scrollToAnchor(item)} key={item}>{item}</li>
                            }):""
                        }
                    </ul>
                </div>
            </div>
        )
    }
}
