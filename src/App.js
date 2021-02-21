import React, { Component } from "react";
import GamePicker from "./GamePicker";
// import logo from './logo.svg';
import { MDBDataTable, MDBContainer, MDBRow } from 'mdbreact';
import { MDBCol, MDBInput } from 'mdbreact';
import Amplify, { API } from "aws-amplify";
import aws_exports from "./aws-exports";
import { withAuthenticator } from "aws-amplify-react";

import './App.css';

Amplify.configure(aws_exports);

const GameStatus = {
  UNKNOWN: 0,
  NOT_STARTED: 1,
  STARTED: 2,
  ENDED: 3
}
Object.freeze(GameStatus);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newEntrant: false,
      joined: false,
      idFound: false,
      errorResponse: true,
      simFinal: 0,
      gameStatus: [
        [GameStatus.UNKNOWN, GameStatus.UNKNOWN, GameStatus.UNKNOWN, GameStatus.UNKNOWN],
        [GameStatus.UNKNOWN, GameStatus.UNKNOWN],
        [GameStatus.UNKNOWN]
      ],
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
            label: 'Behind',
            field: 'ptsBehind',
            sort: 'asc',
            width: 150
          },
          {
            label: 'SB Pts',
            field: 'sbPoints',
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
            label: 'Behind',
            field: 'ptsBehind',
            sort: 'asc',
            width: 150
          },
          {
            label: 'SB Pts',
            field: 'sbPoints',
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
      r3g1: 0,
      r3started: [true],
      r3ended: [false],
      r3margins: [0],
      r3table: {
        columns: [
          {
            label: 'Name',
            field: 'name',
            sort: 'asc',
            width: 150
          },
          {
            label: <span id="r3TotalHeader">Total</span>,
            field: 'total',
            sort: 'asc',
            width: 150
          },
          {
            label: 'Behind',
            field: 'ptsBehind',
            sort: 'asc',
            width: 150
          },
          {
            label: 'SB Pts',
            field: 'sbPoints',
            sort: 'asc',
            width: 150
          },
          {
            label: 'at',
            field: 'r3g1',
            sort: 'asc',
            width: 270
          },
          {
            label: 'Week 2 Subtotal',
            field: 'week2total',
            sort: 'asc',
            width: 150
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
    if (el !== null) {
      el.click();
      el = document.getElementById("r2TotalHeader");
      if (el !== null) {
        el.click();
      }
      el = document.getElementById("r3TotalHeader");
      if (el !== null) {
        el.click();
      }
    }
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
    if (response1['id'] !== undefined && response1['joined'] === true) {
      // UNDO THIS
      // response1['r3g1'] = response1['r1g3'];
      this.setState({
        idFound: true,
        r1g1: response1['r1g1'],
        r1g2: response1['r1g2'],
        r1g3: response1['r1g3'],
        r1g4: response1['r1g4'],
        r2g1: response1['r2g1'],
        r2g2: response1['r2g2'],
        r3g1: response1['r3g1']
      });
    } else if (response1['id'] !== undefined) {
      this.setState({newEntrant: true});
    } else if (response1['newEntrant']) {
      this.setState({newEntrant: true});
    }
    const response = await API.get("ppoolApi", "/items/week1/fakeId");
    // response[0]['gameStatus'] = [ [ 1, 1, 1, 1 ], [ 1, 1 ], [ 1 ]];
    this.setState({gameStatus: response[0]['gameStatus']});
    const startedValues = [GameStatus.STARTED, GameStatus.ENDED];
    this.setState({
      r1started: [
        startedValues.includes(response[0]['gameStatus'][0][0]),
        startedValues.includes(response[0]['gameStatus'][0][1]),
        startedValues.includes(response[0]['gameStatus'][0][2]),
        startedValues.includes(response[0]['gameStatus'][0][3])
      ],
      r2started: [
        startedValues.includes(response[0]['gameStatus'][1][0]),
        startedValues.includes(response[0]['gameStatus'][1][1])
      ],
      r3started: [
        startedValues.includes(response[0]['gameStatus'][2][0])
      ]
    });
    this.setState({
      r1ended: [
        response[0]['gameStatus'][0][0] === GameStatus.ENDED,
        response[0]['gameStatus'][0][1] === GameStatus.ENDED,
        response[0]['gameStatus'][0][2] === GameStatus.ENDED,
        response[0]['gameStatus'][0][3] === GameStatus.ENDED
      ],
      r2ended: [
        response[0]['gameStatus'][1][0] === GameStatus.ENDED,
        response[0]['gameStatus'][1][1] === GameStatus.ENDED
      ],
      r3ended: [
        response[0]['gameStatus'][2][0] === GameStatus.ENDED
      ]
    })
    var tempgrid1 = {...this.state.r1table};
    var tempgrid2 = {...this.state.r2table};
    var tempgrid3 = {...this.state.r3table};
    var gamestarted = [
      startedValues.includes(response[0]['gameStatus'][0][0]),
      startedValues.includes(response[0]['gameStatus'][0][1]),
      startedValues.includes(response[0]['gameStatus'][0][2]),
      startedValues.includes(response[0]['gameStatus'][0][3]),
      startedValues.includes(response[0]['gameStatus'][1][0]),
      startedValues.includes(response[0]['gameStatus'][1][1]),
      startedValues.includes(response[0]['gameStatus'][2][0]),
    ]
    for (var i = 0; i < response.length; i++) {
      if (response[i]['fullname'] === "margin") {
        this.setState({
          r1margins: [
            response[i]['r1g1'],
            response[i]['r1g2'],
            response[i]['r1g3'],
            response[i]['r1g4']
          ]
        });
        this.setState({
          r2margins: [
            response[i]['r2g1'],
            response[i]['r2g2']
          ]
        });
        this.setState({
          r3margins: [
            response[i]['r3g1']
          ]
        });
        this.setState({
          simFinal: [
            response[i]['r3g1']
          ]
        });
      }
    }
    var r1min = 100000;
    var r2min = 100000;
    var r3min = 100000;
    for (i = 0; i < response.length; i++) {
      if (response[i]['realPerson'] !== false && response[i]['joined'] === true) {
        var picks = ['', '', '', ''];
        var total = 0;
        for (var p = 0; p < 4; p++) {
          if (response[i]['r1g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r1g' + (p+1)];
            if (gamestarted[p]) {
              total += Math.abs(picks[p] - this.state.r1margins[p]);
              // picks[p] += " (" + (Math.abs(picks[p] - this.state.r1margins[p])) + ")";
            }
          }
        }
        if (total < r1min) {
          r1min = total;
        }
        var delta = 4;
        for (p = 0; p < 2; p++) {
          if (response[i]['r2g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r2g' + (p+1)];
            if (gamestarted[p+delta]) {
              total += 2 * (Math.abs(picks[p] - this.state.r2margins[p]));
              // picks[p] += " (" + (Math.abs(picks[p] - this.state.r2margins[p])) + ")";
            }
          }
        }
        if (total < r2min) {
          r2min = total;
        }
        delta = 6;
        for (p = 0; p < 1; p++) {
          if (response[i]['r3g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r3g' + (p+1)];
            if (gamestarted[p+delta]) {
              total += 4 * (Math.abs(picks[p] - this.state.r3margins[p]));
              // picks[p] += " (" + (Math.abs(picks[p] - this.state.r3margins[p])) + ")";
            }
          }
        }
        if (total < r3min) {
          r3min = total;
        }
      }
    }
    var j = 0;
    for (i = 0; i < response.length; i++) {
      if (response[i]['realPerson'] !== false && response[i]['joined'] === true) {
        picks = ['', '', '', ''];
        total = 0;
        for (p = 0; p < 4; p++) {
          if (response[i]['r1g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r1g' + (p+1)];
            if (gamestarted[p]) {
              total += Math.abs(picks[p] - this.state.r1margins[p]);
              picks[p] += " (" + (Math.abs(picks[p] - this.state.r1margins[p])) + ")";
            }
          }
        }
        var ptsBehind = Math.abs(total-r1min);
        tempgrid1.rows[j] = {name: response[i]['fullname'], total: total, ptsBehind: ptsBehind, sbPoints: Math.floor(ptsBehind/4+.75),
          r1g1: picks[0], r1g2: picks[1], r1g3: picks[2], r1g4: picks[3]};
        var week1total = total;
        delta = 4;
        for (p = 0; p < 2; p++) {
          if (response[i]['r2g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r2g' + (p+1)];
            if (gamestarted[p+delta]) {
              total += 2 * (Math.abs(picks[p] - this.state.r2margins[p]));
              picks[p] += " (" + (Math.abs(picks[p] - this.state.r2margins[p])) + ")";
            }
          }
        }
        ptsBehind = Math.abs(total-r2min);
        tempgrid2.rows[j] = {name: response[i]['fullname'], total: total, ptsBehind: ptsBehind, sbPoints: Math.floor(ptsBehind/4+.75),
          r2g1: picks[0], r2g2: picks[1], week1total: week1total};
        var week2total = total;
        delta = 6;
        for (p = 0; p < 1; p++) {
          if (response[i]['r3g' + (p+1)] !== undefined) {
            picks[p] = response[i]['r3g' + (p+1)];
            if (gamestarted[p+delta]) {
              total += 4 * (Math.abs(picks[p] - this.state.r3margins[p]));
              picks[p] += " (" + (Math.abs(picks[p] - this.state.r3margins[p])) + ")";
            }
          }
        }
        ptsBehind = Math.abs(total-r3min);
        tempgrid3.rows[j] = {name: response[i]['fullname'], total: total, ptsBehind: ptsBehind, sbPoints: Math.floor(ptsBehind/4+.75),
          r3g1: picks[0], week2total: week2total, week1total: week1total};
        j++;
      } else if (onmount) {
        if (response[i]['id'] === 'awayTeam') {
          // TODO: Fix hard coded g index. Match on 'at' instead
          for (var g = 1; g <= 4; g++) {
            tempgrid1.columns[g+3].label = response[i]['r1g' + g] + ' ' + tempgrid1.columns[g+3].label;
          }
          for (g = 1; g <= 2; g++) {
            tempgrid2.columns[g+3].label = response[i]['r2g' + g] + ' ' + tempgrid2.columns[g+3].label;
          }
          for (g = 1; g <= 1; g++) {
            tempgrid3.columns[g+3].label = response[i]['r3g' + g] + ' ' + tempgrid3.columns[g+3].label;
          }
        } else if (response[i]['id'] === 'homeTeam') {
          for (g = 1; g <= 4; g++) {
            tempgrid1.columns[g+3].label = tempgrid1.columns[g+3].label + ' ' + response[i]['r1g' + g];
            if (gamestarted[g-1]) {
              // TODO: Make this independent of response row ordering. Away team side doesn't work.
              tempgrid1.columns[g+3].label += " (" + this.state.r1margins[g-1] + ")";
            }
          }
          delta = 4;
          for (g = 1; g <= 2; g++) {
            tempgrid2.columns[g+3].label = tempgrid2.columns[g+3].label + ' ' + response[i]['r2g' + g];
            if (gamestarted[g-1+delta]) {
              // TODO: Make this independent of response row ordering. Away team side doesn't work.
              tempgrid2.columns[g+3].label += " (" + this.state.r2margins[g-1] + ")";
            }
          }
          delta = 6;
          for (g = 1; g <= 1; g++) {
            tempgrid3.columns[g+3].label = tempgrid3.columns[g+3].label + ' ' + response[i]['r3g' + g];
            if (gamestarted[g-1+delta]) {
              // TODO: Make this independent of response row ordering. Away team side doesn't work.
              tempgrid3.columns[g+3].label += " (" + this.state.r3margins[g-1] + ")";
            }
          }
        }
      }
    }
    this.setState({r1table: tempgrid1});
    this.setState({r2table: tempgrid2});
    this.setState({r3table: tempgrid3});
  }

  handleSimChange = event => {
    const id = event.target.id;
    this.setState({ [id]: event.target.value });
    var tempgrid3 = {...this.state.r3table};
    var r3min = 100000;
    let gameStrings = tempgrid3.columns[4].label.split("(");
    let ifString = "";
    if (event.target.value !== this.state.r3margins[0]) {
      ifString = "If ";
    }
    tempgrid3.columns[4].label = gameStrings[0] + "(" + ifString + event.target.value + ")";
    for (let i in tempgrid3.rows) {
      let pickStrings = tempgrid3.rows[i].r3g1.split("(");
      let pick = parseInt(pickStrings[0]);
      let oldDelta = parseInt(pickStrings[1]);
      let newDelta = Math.abs(event.target.value - pick);
      tempgrid3.rows[i].r3g1 = `${pickStrings[0]}(${newDelta})`;
      tempgrid3.rows[i].total = tempgrid3.rows[i].total + 4 * (newDelta - oldDelta);
      if (tempgrid3.rows[i].total < r3min) {
        r3min = tempgrid3.rows[i].total;
      }
    }
    for (let i in tempgrid3.rows) {
      tempgrid3.rows[i].ptsBehind = Math.abs(tempgrid3.rows[i].total-r3min);
      tempgrid3.rows[i].sbPoints = Math.floor(tempgrid3.rows[i].ptsBehind/4+.75);
    }
    tempgrid3.columns[1].sort = 'asc';
    let el = document.getElementById("r3TotalHeader");
    if (el !== null) {
      el.click();
    }
  };

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
        joined: true
      }
    });
    this.fetchData();
  };

  update = async event => {
    event.preventDefault();
    const response = await API.put("ppoolApi", "/items", {
      body: {
        round: 1,
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
        round: 2,
        r2g1: this.state.r2g1,
        r2g2: this.state.r2g2
      }
    });
    if (response['error'] !== undefined) {
      alert(response['error']);
    }
    this.fetchData();
  };

  update3 = async event => {
    event.preventDefault();
    const response = await API.put("ppoolApi", "/items", {
      body: {
        round: 3,
        r3g1: this.state.r3g1
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
          {this.state.r2ended[1] ? (
            <form onSubmit={this.update3}>
              <legend>2021 NFL Super Bowl</legend>
              {this.state.r3started[0] ?
                <MDBCol sm="6" size="12">
                  <MDBInput
                    label="If the final margin is:"
                    id="simFinal" value={this.state['simFinal']} type="number" onChange={this.handleSimChange}/>
                </MDBCol>
                :
                <div>
                  <small>Use negative numbers to pick the away team, positive for the home team</small><br/>
                  <MDBContainer>
                    <MDBRow>
                      <GamePicker label={this.state.r3table['columns'][4]['label']} id='r3g1' val={this.state['r3g1']} onChange={this.handleChange}/>
                    </MDBRow>
                  </MDBContainer>
                  <button type="submit" className="btn btn-primary"> Submit Super Bowl Pick </button>
                </div>
              }
              <MDBDataTable
                striped
                bordered
                hover
                paging={false}
                searching={false}
                data={this.state.r3table}
              />
            </form>
            ) : <span/>
          }
           {this.state.r1ended[3] ? (
            <div>
            <legend>2021 NFL Conference Championships</legend>
            <form onSubmit={this.update2}>
              {!this.state.r2started[1] ?
                  <div><small>Use negative numbers to pick the away team, positive for the home team</small><br/></div>
              : <span/> }
                <MDBContainer>
                    <MDBRow>
                      {!this.state.r2started[0] ?
                          <GamePicker label={this.state.r2table['columns'][4]['label']} id='r2g1' val={this.state['r2g1']} onChange={this.handleChange}/>
                      : <span/> }
                      {!this.state.r2started[1] ?
                          <GamePicker label={this.state.r2table['columns'][5]['label']} id='r2g2' val={this.state['r2g2']} onChange={this.handleChange}/>
                      : <span/> }
                    </MDBRow>
                </MDBContainer>
              {!this.state.r2started[1] ?
                <button type="submit" className="btn btn-primary"> Submit Round 2 Picks </button>
              : <span/> }
            </form>
            </div>
            ) : (
            <form onSubmit={this.update}>
                <legend>2021 NFL Divisional Round</legend>
              {!this.state.r1started[3] ?
                  <div><small>Use negative numbers to pick the away team, positive for the home team</small><br/></div>
              : <span/> }
                <MDBContainer>
                    <MDBRow>
                      {!this.state.r1started[0] ?
                          <GamePicker label={this.state.r1table['columns'][4]['label']} id='r1g1' val={this.state['r1g1']} onChange={this.handleChange}/>
                      : <span/> }
                      {!this.state.r1started[1] ?
                          <GamePicker label={this.state.r1table['columns'][5]['label']} id='r1g2' val={this.state['r1g2']} onChange={this.handleChange}/>
                      : <span/> }
                      {!this.state.r1started[2] ?
                          <GamePicker label={this.state.r1table['columns'][6]['label']} id='r1g3' val={this.state['r1g3']} onChange={this.handleChange}/>
                      : <span/> }
                      {!this.state.r1started[3] ?
                          <GamePicker label={this.state.r1table['columns'][7]['label']} id='r1g4' val={this.state['r1g4']} onChange={this.handleChange}/>
                      : <span/> }
                    </MDBRow>
                </MDBContainer>
              {!this.state.r1started[3] ?
                <div>
                  <button type="submit" className="btn btn-primary"> Submit Round 1 Picks </button>
                <p/>
                </div>
              : <span/> }
            </form>
          )}
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
              <legend>2021 NFL Divisional Round</legend>
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
        ) : (this.state.newEntrant && this.state.gameStatus[0][0] === GameStatus.NOT_STARTED ? (
          <div>
            <h1>Welcome to the 2021 NFL Playoff Pool!</h1>
            <button onClick={this.handleSubmit}>TL;DR. Join the pool for $20!</button><p/>
            <p>The pool runs for 3 rounds, Divisional playoffs through Super Bowl.
            For each game in the round, you'll pick a winner and a margin of victory.<br/>
            You accumulate points based on the difference between your predicted margin and the actual outcome.<br/>
            Points are doubled in Week 2 and multiplied by 4 in the Super Bowl. The goal is to have the fewest total points at the end.</p>
            <p><strong>EXAMPLE:</strong> You pick the Packers to win by 3. They lose by 7. You were off by 10.<br/>
            In the first round, this would cost you 10 points.
            In the second round, 20 points.
            In the Super Bowl, 40 points!</p>
            <p>Entry fee is $20 and should be paid prior to the first game on Saturday.<br/>
            Payment can be made via PayPal to thayosh@gmail.com.<br/>
            Please use the friends and family option to avoid PayPal fees being deducted.</p>
            <p><strong>PAYOUT:</strong><br/>
            <strong>3rd Place</strong>- Gets the $20 back<br/>
            <strong>2nd Place</strong>- 30% of the remaining pot<br/>
            <strong>1st Place</strong>- 70% of the remaining pot</p>
            <button onClick={this.handleSubmit}>Join the pool!</button>
            </div>
          ) : (
            (this.state.newEntrant && [ GameStatus.STARTED, GameStatus.ENDED ].includes(this.state.gameStatus[0][0]) ? (
                <div>
                  <h1>Sorry</h1>
                  <p>Sorry, the playoff pool has started, and new entries are no longer accepted.</p>
                </div>
              ) : (
                <div>
                  <h1>Past winners:</h1>
                  <h4>2021: Jim Silverstein</h4>
                  <h4>2020: Xinfeng Ma, Bill Dyer, Jayson Leseth</h4>
                  <h4>2019: Mike Holton</h4>
                  <h4>2018: Robert Holton</h4>
                  <h4>2017: Chuck Medhurst</h4>
                  <h4>2016: Erik Medhurst</h4>
                  <h4>2015: Chuck Medhurst</h4>
                  <h4>2014: Kevn Bieschke</h4>
                  <h4>2013: Chris Medhurst</h4>
                  <h4>2012: Tom Hayosh</h4>
                  <h4>2010: Earl Holton</h4>
                </div>
              )
            )
          )
        )}
      </div>
    );
  }}

// Monkey: 7, 10, 10, 4, 7.5, 7

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
