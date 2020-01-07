import React, { Component } from "react";
import logo from './logo.svg';
import { MDBDataTable, MDBContainer, MDBRow, MDBCol, MDBInput } from 'mdbreact';
import Amplify, { API } from "aws-amplify";
import aws_exports from "./aws-exports";
import { withAuthenticator } from "aws-amplify-react";

import './App.css';

Amplify.configure(aws_exports);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newEntrant: false,
      idFound: false,
      errorResponse: true,
      r1g1: 0,
      r1g2: 0,
      r1g3: 0,
      r1g4: 0,
      r1started: [true, true, true, true],
      r1margins: [0, 0, 0, 0],
      list: [],
      item: {},
      table: {
        columns: [
          {
            label: 'Name',
            field: 'name',
            sort: 'asc',
            width: 150
          },
          {
            label: 'Total',
            field: 'total',
            sort: 'asc',
            width: 150
          },
          {
            label: 'at',
            field: 'r1g1',
            sort: 'asc',
            width: 270
          },
          {
            label: 'at',
            field: 'r1g2',
            sort: 'asc',
            width: 270
          },
          {
            label: 'at',
            field: 'r1g3',
            sort: 'asc',
            width: 270
          },
          {
            label: 'at',
            field: 'r1g4',
            sort: 'asc',
            width: 270
          }
        ],
        rows: []
      } 
    };
  }

  async componentDidMount() {
    await this.fetchData(true);
    /*
    await API.post("ppoolApi", "/items", {
      body: {
        r1g1: -3
        // id: Date.now().toString(),
      }
    });
    */
  }

  async fetchData(onmount=false) {
    const response1 = await API.get("ppoolApi", "/items/object/fakeId");
    if (response1['id'] !== undefined) {
      this.setState({
        idFound: true,
        r1g1: response1['r1g1'],
        r1g2: response1['r1g2'],
        r1g3: response1['r1g3'],
        r1g4: response1['r1g4']
      });
    } else if (response1['newEntrant']) {
      this.setState({newEntrant: true});
    }
    const response = await API.get("ppoolApi", "/items/week1/fakeId");
    this.setState({ list: { ...response }, showDetails: true });
    var temptable = {...this.state.table};
    var j = 0;
    var gamestarted = [true, true, true, true];
    for (var i = 0; i < response.length; i++) {
      const isCurrentUserHack = response[i]['edit-r1g1'] ||
        response[i]['edit-r1g2'] ||
        response[i]['edit-r1g3'] ||
        response[i]['edit-r1g4'];
        if (isCurrentUserHack) {
          gamestarted = [
              !response[i]['edit-r1g1'],
              !response[i]['edit-r1g2'],
              !response[i]['edit-r1g3'],
              !response[i]['edit-r1g4']
          ]
        }
        this.setState({r1started: [...gamestarted]});
    }
    for (var i = 0; i < response.length; i++) {
      if (response[i]['fullname'] === "margin") {
        this.setState({
          r1margins: [
            response[i]['r1g1'],
            response[i]['r1g2'],
            response[i]['r1g3'],
            response[i]['r1g4']
          ]
        })
      } else if (response[i]['realPerson'] != false) {
        var picks = ['', '', '', ''];
        var total = 0;
        for (var p = 0; p < 4; p++) {
          if (response[i]['r1g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r1g' + (p+1)];
            if (gamestarted[p]) {
              total += Math.abs(picks[p] - this.state.r1margins[p]);
            }
          }
        }
        temptable.rows[j++] = {name: response[i]['fullname'], total: total, r1g1: picks[0], r1g2: picks[1], r1g3: picks[2], r1g4: picks[3]};
      } else if (onmount) {
        if (response[i]['id'] === 'awayTeam') {
          // TODO: Fix hard coded g index. Match on 'at' instead
          for (var g = 1; g <= 4; g++) {
            temptable.columns[g+1].label = response[i]['r1g' + g] + ' ' + temptable.columns[g+1].label;
          }
        } else if (response[i]['id'] === 'homeTeam') {
          for (var g = 1; g <= 4; g++) {
            temptable.columns[g+1].label = temptable.columns[g+1].label + ' ' + response[i]['r1g' + g];
          }
        }
      }
    }
    this.setState({table: temptable});
  }

  handleChange = event => {
    const id = event.target.id;
    this.setState({ [id]: event.target.value });
  };

  handleSubmit = async event => {
    event.preventDefault();
    await API.post("ppoolApi", "/items", {
      body: {
        r1g1: 0,
        r1g2: 0,
        r1g3: 0,
        r1g4: 0,
      }
    });
    this.fetchData();
  };

  update = async event => {
    event.preventDefault();
    const response = await API.put("ppoolApi", "/items", {
      body: {
        firstarg: "asdf",
        r1g1: this.state.r1g1,
        r1g2: this.state.r1g2,
        r1g3: this.state.r1g3,
        r1g4: this.state.r1g4
      }
    });
    if (response['error'] !== undefined) {
      alert(response['error']);
    }
    this.fetchData();
  };

  render() {
    return (
      <div className="App">
        {this.state.idFound ? (
          <div>
          <form onSubmit={this.update}>
              <legend>2020 NFL Wild Card Round</legend>
              <MDBContainer>
                  <MDBRow>
                    {!this.state.r1started[0] ?
                    <MDBCol sm="3" size="12">Game 1</MDBCol>
                    : <span/> }
                    {!this.state.r1started[1] ?
                    <MDBCol sm="3" size="12">Game 2</MDBCol>
                    : <span/> }
                    {!this.state.r1started[2] ?
                    <MDBCol sm="3" size="12">Game 3</MDBCol>
                    : <span/> }
                    {!this.state.r1started[3] ?
                    <MDBCol sm="3" size="12">Game 4</MDBCol>
                    : <span/> }
                </MDBRow>
                <MDBRow>
                    {!this.state.r1started[0] ?
                    <MDBCol sm="3" size="12">
                      <MDBInput id='r1g1' value={this.state.r1g1} type="number" onChange={this.handleChange}/>
                    </MDBCol>
                    : <span/> }
                    {!this.state.r1started[1] ?
                    <MDBCol sm="3" size="12">
                      <MDBInput id='r1g2' value={this.state.r1g2} type="number" onChange={this.handleChange}/>
                    </MDBCol>
                    : <span/> }
                    {!this.state.r1started[2] ?
                    <MDBCol sm="3" size="12">
                      <MDBInput id='r1g3' value={this.state.r1g3} type="number" onChange={this.handleChange}/>
                    </MDBCol>
                    : <span/> }
                    {!this.state.r1started[3] ?
                    <MDBCol sm="3" size="12">
                      <MDBInput id='r1g4' value={this.state.r1g4} type="number" onChange={this.handleChange}/>
                    </MDBCol>
                    : <span/> }
                </MDBRow>
              </MDBContainer>
                    {!this.state.r1started[3] ?
              <button type="submit" className="btn btn-primary"> Submit </button>
                    : <span/> }
          </form>
          <MDBDataTable
            striped
            bordered
            hover
            paging={false}
            searching={false}
            data={this.state.table}
          />
          </div>
        ) : (this.state.newEntrant ? (
          <div>
            <h1>Click here to join the pool for $20</h1>
            <button onClick={this.handleSubmit}>JOIN!!!</button>
            </div>
          ) : (
            <h1>Default state</h1>
          )
        )}
      </div>
    );
  }}


const MyTheme = {
  googleSignInButton: { backgroundColor: "red", borderColor: "red" },
  button: { backgroundColor: "blue", borderColor: "red" },
  navButton: { backgroundColor: "blue" },
  signInButtonIcon: { display: "none" }
};

export default withAuthenticator(App, {
  includeGreetings: true,
  theme: MyTheme,
  signUpConfig: {
    hiddenDefaults: [ "phone_number", "email" ],
    signUpFields: [
      { label: "Name", key: "name", required: true, type: "string", placeholder: "Enter your name" }
      // { label: "Email Address", key: "username", required: true, type: "string" }
    ]
  }
});
