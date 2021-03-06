import React, {Component} from 'react'
import swal from 'sweetalert';
var firebase = require('firebase');

var config = {
    apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    databaseURL: "xxxxxxxxxxxxxxxxxxxxxxxx",
    projectId: "nextcoin-123",
    storageBucket: "xxxxxxxxxxxxxxxxxxxxxxx",
    messagingSenderId: "xxxxxxxxxxxxxxxxxx"
  };
  firebase.initializeApp(config);

class NextCoin extends Component {
  render(){
    return(
      <div>
        <Login />
      </div>
    );
  }
}

class Login extends Component {
  login(){
    var provider = new firebase.auth.GoogleAuthProvider();
    var promise = firebase.auth().signInWithPopup(provider);

    promise
    .then((userz) => {
      var ref = document.getElementById('Login');
      ref.classList.add('hide');
      console.log("Login was successful ");
      this.setState({uid: userz.user.uid})
      this.setState({name: userz.user.displayName})
      this.setState({email: userz.user.email})
      this.setState({isLogin: true});
    })
    .catch((e) => {
      this.setState({err: e.message});
    });


  }

  constructor(props){
    super(props);

    this.state = {
      err: '',
      isLogin: false,
      name: '',
      uid: '',
      email: '',
    };
    this.login = this.login.bind(this);
  }
  render(){
    if (this.state.isLogin){
    var abc = <Getinfo uid={this.state.uid} name={this.state.name} email={this.state.email}/>;
    document.getElementById("err").classList.add('hide');
    }
    return(
      <div>
        <br/>
        <button id="Login" onClick={this.login}>Sign In with Nixor Email And Password</button>
        <h3 id="err">{this.state.err}</h3>
        {abc}
      </div>
    );
  }
}

class Getinfo extends Component {
  componentWillMount(){
    var promise = firebase.database().ref('Users/' + this.props.uid).once('value');
    promise
    .then((snapshot) => {
      this.setState({data: snapshot.val()});
      if(!this.state.data){
        firebase.database().ref('Users/' + this.props.uid).set({
          name: this.props.name,
          email: this.props.email,
          balance: 1000,
          coins: 1
        }).then((x) => {this.setState({isLogin: true});});
        this.setState({info: {
          name: this.props.name,
          email: this.props.email,
          balance: 1000,
          coins: 1
        }});
      } else {
        firebase.database().ref('Users/' + this.props.uid).once('value').then((snapshot) => {
          this.setState({info: snapshot.val()});
          this.setState({isLogin: true});
        });
        console.log(this.state.info);
        console.log("inside else");
      }
    })
    .catch((e) => {
      this.setState({msg: e.message});
    });

  }

  constructor(props){
    super(props);

    this.state = {
      msg: '',
      data: {},
      info: {},
      isLogin: false
    };
  }

  render(){
    var abc;
    if(this.state.isLogin){
      abc = <Main info={this.state.info} uid={this.props.uid} />
    }
    return(
      <div>
        {this.state.msg}
        {abc}
      </div>
    );
  }
}

class Main extends Component {

  componentWillMount(){
    firebase.database().ref('NextCoin/').on('value', (snapshot) => {
      this.setState({msg: snapshot.val().value});
      this.setState({coinprice: snapshot.val().value});
      this.setState({buyPrice: snapshot.val().value * 1.5});
      this.setState({nesProfit: snapshot.val().nesProfit});
      this.setState({showButtons_1: true});
    });
    firebase.database().ref('Users/' + this.props.uid).on('value', (snapshot) => {
      if(this.state.coins !== null){
      this.setState({coins: snapshot.val().coins});}
      if(this.state.balance !== null){
      this.setState({balance: snapshot.val().balance});}
      this.setState({showButtons_2: true});
    });
  }

  buy(){
    if(this.state.balance >= this.state.buyPrice){

      if(window.confirm("Do you want to buy the coin for : "  + this.state.buyPrice)) {
        document.getElementById("buy").classList.add("hide");
        document.getElementById("sell").classList.add("hide");

        setTimeout(() => {
          var oldPrice = 0;
            firebase.database().ref("NextCoin/").transaction((nextcoin) => {
              if (nextcoin) {
                nextcoin.value = nextcoin.value + this.state.factor;
                nextcoin.nesProfit = nextcoin.nesProfit + (0.5 * nextcoin.value)
                this.setState({newPrice: nextcoin});
                oldPrice = (nextcoin.value - this.state.factor) * 1.5;
              }
              return nextcoin;
            }).then((y) => {
              var updates = {};
              updates['Users/' + this.props.uid] = {
                name: this.props.info.name,
                email: this.props.info.email,
                coins: this.state.coins + 1,
                balance: this.state.balance - oldPrice
              }
              firebase.database().ref().update(updates).then((z) => {
                    this.setState({newMsg: "Coin was successfully bought for " +  oldPrice});
                    firebase.database().ref('Users/' + this.props.uid + 'transactions/').push().set({
                      buy: oldPrice
                    });
                    document.getElementById("buy").classList.remove("hide");
                    document.getElementById("sell").classList.remove("hide");
                });
              });
          }, 1000);
      }

    };
  }

  sell(){
    if(this.state.coins !== 0){

      if(window.confirm("Do you want to sell the coin for : "  + this.state.coinprice)) {
          document.getElementById("buy").classList.add("hide");
          document.getElementById("sell").classList.add("hide");

          setTimeout(() => {
            var oldPrice = 0;
              firebase.database().ref("NextCoin/").transaction((nextcoin) => {
                if (nextcoin) {
                  nextcoin.value = nextcoin.value - this.state.factor;
                  this.setState({newPrice: nextcoin});
                  oldPrice = (nextcoin.value + this.state.factor) * 1.5;
                }
                return nextcoin;
              }).then((y) => {
                var updates = {};
                updates['Users/' + this.props.uid] = {
                  name: this.props.info.name,
                  email: this.props.info.email,
                  coins: this.state.coins - 1,
                  balance: (this.state.balance + this.state.newPrice.value + this.state.factor)
                }
                firebase.database().ref().update(updates).then((z) => {
                      this.setState({newMsg: "Coin was successfully sold for " +  (this.state.newPrice.value + this.state.factor)});
                      firebase.database().ref('Users/' + this.props.uid + 'transactions/').push().set({
                        sell: oldPrice
                      });
                      document.getElementById("buy").classList.remove("hide");
                      document.getElementById("sell").classList.remove("hide");
                  });
                });
            }, 1000);
  };
    };
  }

  transactions(){
    var dataB = [];
    var dataS = [];
    swal({
      title: "Transactions",
      buttons: {
        a: {
          text: "Buyings",
          value: "buy"
        },
        b: {
          text: "Sellings",
          value: "sell"
        },
      }
    }).then((value) => {
      firebase.database().ref('Users/' + this.props.uid + 'transactions/').once('value').then( (snapshots) => {
        var keys = Object.keys(snapshots.val());
        var snap = snapshots.val()
        var j = 0;
        var k = 0

        for(var i = 0; i< keys.length; i++){
          if(snap[keys[i]].buy !== undefined){
            //console.log(snap[keys[i]].buy)
            dataB[j] = snap[keys[i]].buy;
            j++;
          }
          if(snap[keys[i]].sell !== undefined){
            //console.log(snap[keys[i]].sell)
            dataS[k] = snap[keys[k]].sell;
            k++;
          }
        }
        if(value = "buy"){
          var x = "";
          for(var i = 0; i<dataB.length; i++){
            x = x + (i+1) + ") " + dataB[i].toString() + "\n";
          }
          swal("Buyings" , x);
        } else if (value = "sell") {
          var y = "";
          for(var i = 0; i<dataB.length; i++){
            y = y + (i+1) + ") " + dataB[i].toString() + "\n";
          }
          swal("Sellings" , y);
        }
    })
  })





  }

  constructor(props){
    super(props);

    this.state = {
      msg: '',
      coinprice: '',
      factor: 10,
      balance: this.props.info.balance,
      coins: this.props.info.coins,
      newMsg: '',
      buyPrice: 0,
      nesProfit: 0,
      showButtons_1: false,
      showButtons_2: false,
      newPrice: 0,
      eg: ''
    };
    this.buy = this.buy.bind(this);
    this.sell = this.sell.bind(this);
    this.transactions = this.transactions.bind(this);
  }
  render(){
    //console.log(this.props.info);
    if(this.state.showButtons_1 && this.state.showButtons_2){
      var buttons = <div>
        <button id="buy" onClick={this.buy} >Buy Coin</button>
        <button id="sell" onClick={this.sell} >Sell Coin</button> <br/>
        <button id="transactions" onClick={this.transactions} >View your transactions</button>
      </div>
    };

    return(
      <div>
        <h1>Buying Price:  {this.state.buyPrice}</h1>
        <h1>Selling Price: {this.state.msg}</h1>
        <h3>Name: {this.props.info.name} </h3>
        <h3>balance: {this.state.balance} </h3>
        <h3>coins: {this.state.coins} </h3>
        <h3>{this.state.newMsg}</h3>
        <h4>NES Cuts off 50% as fees whenever a coin is bought</h4>
        {buttons}
      </div>
    )};
}

export default NextCoin;
