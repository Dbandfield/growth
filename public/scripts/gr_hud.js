"use strict";

/**
 * This file contains a React component class which acts as 
 * a HUD over the 3D scene. it is dynamic, and will change 
 * in response to what happens in the scene.
 * 
 * it also contains the individual UI elements
 * as separate React functions.
 */

 var React = require('react');

 class HUD extends React.Component
 {
    constructor(props)
    {
        super(props);
    }

    render()
    {
        return(
            <div>
                <div className='hud container'>
                    <div className='row'>
                        <div className='col-sm-2'>
                            <Status />
                        </div>
                    </div>
                </div>
                <div>
                    <Reticule active={this.props.targetActive}
                                label={this.props.targetLabel}/>
                </div>
                {this.props.pause && <PauseMenu />}
            </div>
        );
    }
 }

 function PauseMenu(props)
 {
     return(
         <div className='overlay' id='overlay'>
            <div className='instructions' id='instructions'>
            W, A, S, D: MOVE<br/>
            F: TRAVEL<br/>
            MOUSE: LOOK
            </div>
         </div>
     );
 }

 function Status(props)
 {
     return(
         <div className='status'> Status </div>
     );
 }

 function Reticule(props)
 {
     return(
            <div className='reticule'> 
            {props.active ? (<img src='../data/hud-assets/target.png' width="64" height = "64"/>) :
                            (<img src='../data/hud-assets/target-in.png' width="64" height = "64" />)}
                <div className='reticule-label'>
                    {props.label}
                </div>
            </div>
     );
 }

 module.exports = HUD;