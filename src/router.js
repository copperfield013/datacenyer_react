import React from 'react'
import { HashRouter, Route , Switch, Redirect} from 'react-router-dom'
import App from './App'
import Admin from './admin'
import Loginit from './login'

export default class iRouter extends React.Component{
    
    render(){
        return (
            <HashRouter>
                <App>                  
                    <Switch>                  
                        <Route path="/login"  component={Loginit}/>
                        <Route path='/admin' render={()=>
                            <Admin />
                        }/>
                        <Redirect from="/" to="/login" /> 
                    </Switch>
                </App>
            </HashRouter>
        )
    }
}