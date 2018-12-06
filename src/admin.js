import React from 'react'
import {Row,Col,Menu,Tabs,Layout,Button,Modal,message} from 'antd'
import "antd/dist/antd.css"
import Header from './components/Header'
import Footer from './components/Footer'
import axios from "./axios/index"
import "./style/common.css"
import Home from './pages/home'
import ActTable from './pages/actTable/actTable'
import Detail from './pages/detail'
const { Content } = Layout;
const SubMenu = Menu.SubMenu;
const TabPane = Tabs.TabPane;

var storage=window.sessionStorage;
export default class Admin extends React.Component{
	constructor(props) {
		super(props);
		this.newTabIndex = 0;
		const panes = [
		  { title: '主页', key: '0',closable: false },
		];
		this.state = {
			activeKey: panes[0].key,
			panes,
			isChange:false
		};
	  }
	componentWillMount(){
		this.request()
	}
	request=()=>{		
		axios.ajax({
			url:'/api/menu/getMenu',
		}).then((res)=>{
			const menuTreeNode = this.renderMenu(res.menus)
			this.setState({
				menuTreeNode
			})      
  		})	
	}
	renderMenu=(data)=>{
		return data.map((item)=>{
			if(item.level2s){
				return (
					<SubMenu title={item.title} key={item.id}>
						{ this.renderMenu(item.level2s) }
					</SubMenu>
				)
			}
			return  <Menu.Item key={item.id}>
						{item.title}
				    </Menu.Item>
		})
	}
	handleMenu=({item, key})=>{
		const panes = this.state.panes;
		let flag = false;
		for(let ops of panes){
		  if(ops.key == key){
			flag = true;
			break;
		  }
		  continue;
		}
		this.setState({ panes, activeKey:key,menuId:key});
		if(flag == false){
		  panes.push({ title: item.props.children, key });
		}
		this.requestList(key)
		console.log(key)
	}
	handleOpen=(openKeys)=>{
		if(openKeys.length>1){
			openKeys.splice(0,1);
		}
	}
	requestList=(key)=>{
		storage.setItem("menuId",key);
		if(storage[key]){
			//console.log("已存储")
			let data=JSON.parse(storage[key])
			this.editList(data)
		}else{
			//console.log("未存储")
			axios.ajax({
				url:`/api/entity/list/${key}`,
				data:{
					isShowLoading:true
				}
			}).then((res)=>{
				if(res){
					var obj = eval(res);
					storage[key]=JSON.stringify(obj); //存储一个列表数据
				}
				let data=JSON.parse(storage[key])
				this.editList(data)
				//console.log(res)
			  })
		}
		
	}
	editList=(data)=>{
		var list=[]
		var codes=[];	
		data.entities.map((item)=>{			
			return codes.push(item.code)
		})
		this.setState({codes}) //不能写一起，不然第一次code取不到
		data.entities.map((item)=>{			
			return list.push(item.fields)
		})
		this.setState({
			formList:data.criterias,
			list:this.renderLists(list,storage.getItem("menuId")),
			moduleTitle:data.module.title,
		})
		if(data.entities.length!=0){
			this.setState({
				columns:this.renderColumns(data.entities[0].fields),
				pageCount:data.pageInfo.count,
			})
		}else{
			this.setState({
				columns:'',
				pageCount:'',
			})
		}
	}
	//list数据转换
	renderLists=(data,menuId)=>{
			let result=[];
			data.map((item,index)=>{
				let list={};
				list['key']=index;//每一项添加key值
				list['code']={...this.state.codes}[index];//添加code
				list['menuId']=menuId;
				item.map((item)=>{
					let key=item.title
					let value=item.value
					list[key]=value
				})
			result.push(list)
		})
		return result
	}
	renderColumns=(data)=>{
		if(data){
			data.map((item)=>{
				let value=item.title;
				item["dataIndex"]=value;								
			})
			var act={
				title: '操作',
				key: 'action',
				render: (text, record) => (
				  <span>
					<Button type="primary" icon="align-left" size="small" onClick={()=>this.handleOperate("detail",record)}>详情</Button>
					<Button type="dashed" icon="edit" size="small" onClick={()=>this.handleOperate("edit",record)}>修改</Button>
					<Button type="danger" icon="delete" size="small" onClick={()=>this.handleOperate("delete",record)}>删除</Button>
				  </span>
				),
			  }
			  data.push(act)
			  return data
		}		
	}
	handleOperate=(type,record)=>{
		let menuId=storage.getItem("menuId");		
		let code=record.code
		this.setState({
			menuId,
			code
		})
		//console.log(code)
        if(type=="delete"){
            Modal.confirm({
				title:"删除提示",
				content:`您确定删除这些数据吗？`,
				okText:"确认",
				cancelText:"取消",
				onOk:()=>{
					axios.ajax({
						url:`/api/entity/remove/${menuId}/${code}`,          
					}).then((res)=>{
						if(res.status=="suc"){
							message.success('删除成功！')                               
						}
						this.requestList(menuId);//刷新页面
					})
				}
			})
		}else if(type=="detail"){	
			this.handleDetail({record},"detail")
		}else if(type=="edit"){
			this.handleDetail({record},"edit")
		}
	}  
	handleDetail=({record},type)=>{		
		const panes = this.state.panes;
		let flag = false;
		var code=type; 
		code+=record.code;  //为了打开新页面，加入detail和eidt的code
		//console.log(record.code)
		for(let ops of panes){			
		  if(ops.key == code){
			flag = true;
			break;
		  }
		  continue;
		}
		let xqTitle="";
		if(type=="detail"){
			xqTitle=record["姓名"]?`详情-${record["姓名"]}`:"详情"
			this.setState({type:"detail"})
		}else{
			xqTitle=record["姓名"]?`修改-${record["姓名"]}`:"修改"
			this.setState({type:"edit"})
		}
		this.requestDetailsTitle(record.code,type)
		this.setState({ 
			panes, 
			activeKey:code,
			xqTitle,
			menuId:record.menuId,
		});
		if(flag == false){
			panes.push({ title:xqTitle, key:code });
		}		
		//console.log(record.code)
	} 	
	requestDetailsTitle=(activeKey,type)=>{
		let typecode=type+activeKey; 
		if(storage[typecode]){
			let data=JSON.parse(storage[typecode])
			this.toDetails(data,type)
		}
	}
	toDetails=(data,type)=>{
		let detailsTitle="";
		let moduleTitle=data.module.title || "";
		let entityTitle=data.entity.title || "";
		//console.log(detailsList)
		if(type=="detail"){
			detailsTitle=entityTitle?moduleTitle+"-"+entityTitle+"-详情":moduleTitle+"-详情";
		}else{
			detailsTitle=entityTitle?moduleTitle+"-修改-"+entityTitle:moduleTitle+"-修改";
		}			
		this.setState({ 
			detailsTitle,
		});
	}
	
	onChange = (activeKey) => {
		let type="";
		this.setState({ activeKey });
		if(activeKey.length>30){
			activeKey.indexOf("detail")==0?type="detail":type="edit";
			//console.log(activeKey+"---"+type)			
			let data=JSON.parse(storage[activeKey]);
			this.toDetails(data,type)

			this.state.panes.map((item)=>{
				if(item.key==activeKey){
					if(activeKey.indexOf("detail")==0){
						activeKey=activeKey.slice(6)
					}else{
						activeKey=activeKey.slice(4)
					}
					this.setState({
						 xqTitle:item.title,
						 type,
						 code:activeKey,
					}) 
				}
			})
		}else if(activeKey.length<=30 && activeKey!=0){
			let data=JSON.parse(storage[activeKey]);
			this.editList(data)
		}	
	}
	onEdit = (targetKey, action) => {
		this[action](targetKey);
	}
	remove = (targetKey) => {
		let type="";
		let activeKey = this.state.activeKey;
		let lastIndex;
		this.state.panes.forEach((pane, i) => {
		  if (pane.key === targetKey) {
			lastIndex = i - 1;
		  }
		});
		const panes = this.state.panes.filter(pane => pane.key !== targetKey);
		if (lastIndex >= 0 && activeKey === targetKey) {
		  activeKey = panes[lastIndex].key;
		}
		this.setState({ panes, activeKey });
		if(activeKey.length>30){
			activeKey.indexOf("detail")==0?type="detail":type="edit";
			let data=JSON.parse(storage[activeKey])
			this.toDetails(data,type)	
			this.state.panes.map((item)=>{
				if(item.key==activeKey){
					if(activeKey.indexOf("detail")==0){
						activeKey=activeKey.slice(6)
					}else{
						activeKey=activeKey.slice(4)
					}
					this.setState({ 
						xqTitle:item.title,
						type,
						code:activeKey,
					}) 
				}
			})
		}else if(this.state.activeKey==targetKey && activeKey!=0){
			let data=JSON.parse(storage[activeKey])
			this.editList(data)
		}
	}
	//搜索和页码
	searchList=(params)=>{
		console.log(params)
		let menuId=storage.getItem("menuId");
		axios.ajax({
			url:`/api/entity/list/${menuId}`,
			data:params
		}).then((res)=>{
			var list=[]
			var code=[];	
			res.entities.map((item)=>{			
				return code.push(item.code)
			})
			res.entities.map((item)=>{
				return list.push(item.fields)
			})
			this.setState({
				list:this.renderLists(list),
				code,
				pageCount:res.pageInfo.count,
			})
		})			
	}
	Welcome = (title,xqTitle) => {
		switch(title){
			case "主页":
			return <Home />
			case xqTitle:
			return <Detail 
						detailsTitle={this.state.detailsTitle}
						type={this.state.type}
						menuId={this.state.menuId}
						code={this.state.code}
			/>
			default:
			return <ActTable 
						formList={this.state.formList} 
						columns={this.state.columns} 
						list={this.state.list} 
						pageCount={this.state.pageCount}
						callbackPage={this.searchList}
						moduleTitle={this.state.moduleTitle}
						searchParams={this.searchList}
						/>
		}  	
	}
	render(){
		return(
			<Row className="container">
				<Col span="4" className="nav-left">
					<div className="logo">
						<img src="/asset/logo.svg" alt="" />
						<h1>系统</h1>
					</div>
					<Menu 
					  	//defaultSelectedKeys={['1']}
						//defaultOpenKeys={['1']}
						mode="inline"
						theme="dark"
						onClick={this.handleMenu}
						onOpenChange={this.handleOpen} //手风琴
					>
						{this.state.menuTreeNode}
				 </Menu>
				</Col>
				<Col span="20" className="main">
					<Header title={this.state.title}/>
					<Content className="content">
						<Tabs
							hideAdd
							onChange={this.onChange}
							activeKey={this.state.activeKey}
							type="editable-card"
							onEdit={this.onEdit}
						>
							{this.state.panes.map(pane => <TabPane 
																tab={pane.title} 
																key={pane.key} 
																closable={pane.closable}
																>
																{this.Welcome(pane.title,this.state.xqTitle)}
														</TabPane>)}
						</Tabs>
					</Content>					
					<Footer/>
				</Col>
			</Row>
		)
	}
}
