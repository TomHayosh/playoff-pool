import React from "react";
import { MDBDataTable, MDBContainer, MDBRow, MDBCol, MDBInput } from 'mdbreact';

export default props => (
  <MDBCol sm="3" size="12">
    <MDBInput
      label={props.label + 
                      " (" + 
                      (
                      props.val === 0 ?
                        "Make your pick" :
                      props.val == 0 ?
                        "ZERO?!? Really!?!"
                      : (props.val < 0 ?
                      props.label.substring(0, props.label.indexOf(" at "))
                      : 
                      props.label.substring(props.label.indexOf(" at ") + 4))
                      + " by " + Math.abs(props.val)
                      )
                      + ")"
      } 
      id={props.id} value={props.val} type="number" onChange={props.onChange}/>
  </MDBCol>);
