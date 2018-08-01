import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Scene from './gr_scene.js';
import HUD from './gr_hud.js';

class Root extends Component
{
    constructor(props)
    {
        super(props);

        this.state = 
        {
            targetActive: false,
            targetLabel: "",
            pause: true
        }
    }

    activateTarget(label)
    {
        this.setState(
            {
                targetActive: true,
                targetLabel: label
            }
        );
    }

    deactivateTarget(label)
    {
        this.setState(
            {
                targetActive: false,
                targetLabel: ""
            }
        );
    }

    pause()
    {
        this.setState(
            {
                pause: true
            }
        )
    }

    unpause()
    {
        this.setState(
            {
                pause: false
            }
        )
    }

    onClickPause()
    {

    }

    render()
    {
        return(    
        <div className='all'>
            <HUD targetActive = {this.state.targetActive}
                    targetLabel = {this.state.targetLabel}
                    pause = {this.state.pause} 
                    onClickPause = {() => {this.onClickPause()}}/>
            <Scene activateTarget = {(label) => {this.activateTarget(label)}} 
                    deactivateTarget = {() => {this.deactivateTarget()}}
                    pause = {() => {this.pause()}}
                    unpause = {() => {this.unpause()}} />
        </div>);
    }
}

ReactDOM.render(
    <Root />, 
    document.getElementById("root")
);