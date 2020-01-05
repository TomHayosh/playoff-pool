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
      r1g1: 0,
      r1g2: 0,
      r1g3: 0,
      r1g4: 0,
      r1edit: [false, false, false, false],
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
    for (var i = 0; i < response.length; i++) {
      if (response[i]['realPerson'] != false) {
        var picks = ['', '', '', ''];
        var editable = [false, false, false, false];
        for (var p = 0; p < 4; p++) {
          if (response[i]['r1g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r1g' + (p+1)];
          }
          editable[p] = response[i]['edit-r1g' + (p+1)];
        }
        temptable.rows[j++] = {name: response[i]['fullname'], r1g1: picks[0], r1g2: picks[1], r1g3: picks[2], r1g4: picks[3]};
        this.setState({r1edit: [...editable]});
      } else if (onmount) {
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
              <legend>Add</legend>
              {this.state.r1edit[0] ?
              <div className="form-group">
                  <label htmlFor="r1g1">Game 1</label>
                  <input type="number" className="form-control" id="r1g1" value={this.state.r1g1} onChange={this.handleChange} />
              </div>
              : <div/> }
              {this.state.r1edit[1] ?
              <div className="form-group">
                  <label htmlFor="r1g2">Game 2</label>
                  <input type="number" className="form-control" id="r1g2" value={this.state.r1g2} onChange={this.handleChange} />
              </div>
              : <div/> }
              {this.state.r1edit[2] ?
              <div className="form-group">
                  <label htmlFor="r1g3">Game 3</label>
                  <input type="number" className="form-control" id="r1g3" value={this.state.r1g3} onChange={this.handleChange} />
              </div>
              : <div/> }
              {this.state.r1edit[3] ?
              <div className="form-group">
                  <label htmlFor="r1g4">Game 4</label>
                  <input type="number" className="form-control" id="r1g4" value={this.state.r1g4} onChange={this.handleChange} />
              </div>
              : <div/> }
              <button type="submit" className="btn btn-primary"> Submit </button>
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
