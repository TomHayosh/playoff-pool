import React, { Component } from "react";
import logo from './logo.svg';
import { MDBDataTable } from 'mdbreact';
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
    await this.fetchData();
    /*
    await API.post("ppoolApi", "/items", {
      body: {
        r1g1: -3
        // id: Date.now().toString(),
      }
    });
    */
  }

  async fetchData() {
    const response1 = await API.get("ppoolApi", "/items/object/fakeId");
    if (response1['id'] !== undefined) {
      this.setState({idFound: true});
    } else if (response1['newEntrant']) {
      this.setState({newEntrant: true});
    }
    const response = await API.get("ppoolApi", "/items/week1/fakeId");
    this.setState({ list: { ...response }, showDetails: true });
    var temptable = {...this.state.table};
    var j = 0;
    for (var i = 0; i < response.length; i++) {
      if (response[i]['realPerson'] != false) {
        var picks = ['', '', '', ''];
        for (var p = 0; p < 4; p++) {
          if (response[i]['r1g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r1g' + (p+1)];
          }
          picks[p] = '' + picks[p] + response[i]['edit-r1g' + (p+1)];
        }
        temptable.rows[j++] = {name: response[i]['fullname'], r1g1: picks[0], r1g2: picks[1], r1g3: picks[2], r1g4: picks[3]};
      } else {
        if (response[i]['id'] === 'awayTeam') {
          for (var g = 1; g <= 4; g++) {
            temptable.columns[g].label = response[i]['r1g' + g] + ' ' + temptable.columns[g].label;
          }
        } else if (response[i]['id'] === 'homeTeam') {
          for (var g = 1; g <= 4; g++) {
            temptable.columns[g].label = temptable.columns[g].label + ' ' + response[i]['r1g' + g];
          }
        }
      }
    }
    this.setState({table: temptable});
  }

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

  render() {
    return (
      <div className="App">
        {this.state.idFound ? (
          <MDBDataTable
            striped
            bordered
            hover
            data={this.state.table}
          />
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
  navButton: { backgroundColor: "red" },
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
