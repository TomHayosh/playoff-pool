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
      r1ended: [false, false, false, false],
      r1margins: [0, 0, 0, 0],
      r1table: {
        columns: [
          {
            label: 'Name',
            field: 'name',
            sort: 'asc',
            width: 150
          },
          {
            label: <span id="r1TotalHeader">Total</span>,
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
      },
      r2g1: 0,
      r2g2: 0,
      r2started: [true, true],
      r2ended: [false, false],
      r2margins: [0, 0],
      r2table: {
        columns: [
          {
            label: 'Name',
            field: 'name',
            sort: 'asc',
            width: 150
          },
          {
            label: <span id="r2TotalHeader">Total</span>,
            field: 'total',
            sort: 'asc',
            width: 150
          },
          {
            label: 'at',
            field: 'r2g1',
            sort: 'asc',
            width: 270
          },
          {
            label: 'at',
            field: 'r2g2',
            sort: 'asc',
            width: 270
          },
          {
            label: 'Week 1 Subtotal',
            field: 'week1total',
            sort: 'asc',
            width: 150
          }
        ],
        rows: []
      },
    };
  }

  async componentDidMount() {
    await this.fetchData(true);
    var el = document.getElementById("r1TotalHeader");
    el.click();
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
    var tempgrid1 = {...this.state.r1table};
    var tempgrid2 = {...this.state.r2table};
    var j = 0;
    var gamestarted = [true, true, true, true, true, true, true];
    for (var i = 0; i < response.length; i++) {
      const isCurrentUserHack = response[i]['edit-r1g1'] ||
        response[i]['edit-r1g2'] ||
        response[i]['edit-r1g3'] ||
        response[i]['edit-r1g4'] ||
        response[i]['edit-r2g1'] ||
        response[i]['edit-r2g2'] ||
        response[i]['edit-r3g1'];
        if (isCurrentUserHack) {
          gamestarted = [
              !response[i]['edit-r1g1'],
              !response[i]['edit-r1g2'],
              !response[i]['edit-r1g3'],
              !response[i]['edit-r1g4'],
              !response[i]['edit-r2g1'],
              !response[i]['edit-r2g2'],
              !response[i]['edit-r3g1']
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
      } else if (response[i]['fullname'] === "gameEnded") {
        this.setState({
          r1ended: [
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
              picks[p] += " (" + (Math.abs(picks[p] - this.state.r1margins[p])) + ")";
            }
          }
        }
        tempgrid1.rows[j] = {name: response[i]['fullname'], total: total, r1g1: picks[0], r1g2: picks[1], r1g3: picks[2], r1g4: picks[3]};
        var delta = 4;
        for (var p = 0; p < 2; p++) {
          if (response[i]['r2g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r2g' + (p+1)];
            if (gamestarted[p+delta]) {
              total += Math.abs(picks[p] - this.state.r2margins[p]);
              picks[p] += " (" + (Math.abs(picks[p] - this.state.r2margins[p])) + ")";
            }
          }
        }
        tempgrid2.rows[j] = {name: response[i]['fullname'], total: total, r2g1: picks[0], r2g2: picks[1]};
        j++;
      } else if (onmount) {
        if (response[i]['id'] === 'awayTeam') {
          // TODO: Fix hard coded g index. Match on 'at' instead
          for (var g = 1; g <= 4; g++) {
            tempgrid1.columns[g+1].label = response[i]['r1g' + g] + ' ' + tempgrid1.columns[g+1].label;
          }
          for (var g = 1; g <= 2; g++) {
            tempgrid2.columns[g+1].label = response[i]['r2g' + g] + ' ' + tempgrid2.columns[g+1].label;
          }
        } else if (response[i]['id'] === 'homeTeam') {
          for (var g = 1; g <= 4; g++) {
            tempgrid1.columns[g+1].label = tempgrid1.columns[g+1].label + ' ' + response[i]['r1g' + g];
            if (gamestarted[g-1]) {
              // TODO: Make this independent of response row ordering. Away team side doesn't work.
              tempgrid1.columns[g+1].label += " (" + this.state.r1margins[g-1] + ")";
            }
          }
          for (var g = 1; g <= 2; g++) {
            tempgrid2.columns[g+1].label = tempgrid2.columns[g+1].label + ' ' + response[i]['r1g' + g];
            if (gamestarted[g-1]) {
              // TODO: Make this independent of response row ordering. Away team side doesn't work.
              tempgrid2.columns[g+1].label += " (" + this.state.r1margins[g-1] + ")";
            }
          }
        }
      }
    }
    this.setState({r1table: tempgrid1});
    this.setState({r2table: tempgrid2});
  }

  handleChange = event => {
    const id = event.target.id;
    this.setState({ [id]: event.target.value });
  };

  handleSubmit = async event => {
    event.preventDefault();
    await API.post("ppoolApi", "/items", {
      body: {
        r3g1: 0,
        r2g1: 0,
        r2g2: 0,
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

  update2 = async event => {
    event.preventDefault();
    const response = await API.put("ppoolApi", "/items", {
      body: {
        r2g1: this.state.r2g1,
        r2g2: this.state.r2g2
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
              <legend>2020 NFL Divisional Round</legend>
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
          {this.state.r1ended[3] ?
            <div>
              <MDBDataTable
                striped
                bordered
                hover
                paging={false}
                searching={false}
                data={this.state.r2table}
              />
              <legend>2020 NFL Divisional Round</legend>
            </div>
          : <span/> }
          <MDBDataTable
            striped
            bordered
            hover
            paging={false}
            searching={false}
            data={this.state.r1table}
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
