import React from 'react'
import { Pagination ,Card,Table} from 'antd';
import BaseForm from "./../../components/BaseForm"
import './index.css'

export default class actTable extends React.Component{
    state={
        loading: false,
    }   
    handleFilter=(params)=>{
        //console.log(params)
        this.props.searchParams(params)
    }
    // handleSubmit=()=>{
    //     //let item=this.state.selectedItem;
    //     //console.log(item)
    //     this.setState({
    //         loading: true,
    //       });
    //     setTimeout(() => {
    //         this.setState({
    //             isShowModal: false,
    //             loading: false,
    //         });          
    //         this.request();
    //         this.userForm.props.form.resetFields()          
    //     }, 1000);
    //     let data=this.userForm.props.form.getFieldsValue();
    //     console.log(JSON.stringify(data));
    //     axios.ajax({
    //         url:this.state.type=="add"?'/table/add':'/table/edit',
    //         data:{
    //             params:data,
    //             isShowLoading:false
    //         }           
    //     }).then((res)=>{
    //         if(res.code=="0"){
    //             message.success('操作成功')                               
    //         }
    //     })   
    // }
    // handleCancel=()=>{
    //     this.setState({
    //         isShowModal:false
    //     })
    //     this.userForm.props.form.resetFields()
    // }
    onChange=(pageNumber)=> {
        this.props.callbackPage(pageNumber)
    }
    showTotal=(total)=>{
        return `共 ${total} 条`;
      }
    render(){
        const loading = this.state.loading;
        //详情查看隐藏底部按钮
        let footer="";
        if(this.state.type=="detail"){
            footer={
                footer:null
            }
        }
        return(
            <div>
                <h3>{this.props.moduleTitle}</h3>
                <Card>
                    <BaseForm formList={this.props.formList} filterSubmit={this.handleFilter}/>          
                </Card>   
                
                {/* <div className="buttonDiv" style={{display:this.props.columns?"block":"none"}}>
                    <Button type="primary" icon="plus" onClick={()=>this.handleOperate("add")}>新增</Button>
                    <Button type="danger" icon="delete" onClick={()=>this.handleOperate("delete")}>删除</Button>
                    <Button icon="edit" onClick={()=>this.handleOperate("edit")}>编辑</Button>
                    <Button icon="align-left" onClick={()=>this.handleOperate("detail")}>详情</Button>
                </div>   */}
                <div>
                    <Table
                        columns={this.props.columns}
                        dataSource={this.props.list}
                        bordered
                        pagination={false}
                        style={{display:this.props.columns?"block":"none"}}
                    >
                    </Table>
                    <Pagination 
                        showQuickJumper 
                        defaultCurrent={1} 
                        total={this.props.pageCount} 
                        onChange={this.onChange} 
                        hideOnSinglePage={true}
                        showTotal={()=>this.showTotal(this.props.pageCount)}
                        />
                </div>               
                {/* <Modal
                    title={this.state.title}
                    visible={this.state.isShowModal}
                    onCancel={this.handleCancel}
                    onOk={this.handleSubmit}
                    okText="确认"
                    cancelText="取消"
                    style={{top: 20,width:500}}
                    {...footer}
                >
                    <ModalForm wrappedComponentRef={(inst)=>{this.userForm=inst}} addFormList={this.state.modalFormList} userInfo={this.state.userInfo} type={this.state.type}/>
                </Modal> */}
            </div>
           
        )
    }
}