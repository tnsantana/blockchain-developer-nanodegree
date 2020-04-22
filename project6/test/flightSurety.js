
var Test = require('../config/testConfig.js');
var web3 = require('web3');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it("(airline) first airline is registered when contract is deployed", async () => {
    let airlinesLen = await config.flightSuretyData.airlinesLength();
    let registered = await config.flightSuretyData.isAirline.call(config.firstAirline);
    let active = await config.flightSuretyData.isAirlineActive.call(config.firstAirline);

    assert.equal(registered, true, "First Airline should always be registered");
    assert.equal(airlinesLen, 1, "Invalid airlines list length");
    assert.equal(active, false, "Airline should be inactive if it hasn't provided funding");
  });

  it("(airline) not enough funds", async () => {
      let raised = false;
      let funds = web3.utils.toWei("1", "ether");

      try {
        await config.flightSuretyApp.fund({from: config.firstAirline, value: funds});
      } catch(e) {
          raised = true;
      }

      let active = await config.flightSuretyData.isAirlineActive.call(config.firstAirline);

      assert.equal(active, false, "Airline activated without minimum funds");
      assert.equal(raised, true, "Should not allow fund Airline with less than 10 ether");
    
  });

  it("(airline) fund first", async () => {
    let funds = web3.utils.toWei(config.airline_ante.toString(), "ether");
    
    await config.flightSuretyApp.fund({from: config.firstAirline, value: funds});

    let active = await config.flightSuretyData.isAirlineActive.call(config.firstAirline);

    assert.equal(active, true, "Airline not activated after send minimum funds");
  });
 
  it("(airline) initial auto register", async () => {
    const FIRST_ACCOUNT = 1;
    let airlines2register = config.auto_approved_airlines -  1;

    for (let i = 0; i < airlines2register; i++) {
        account = accounts[i + FIRST_ACCOUNT];
        await config.flightSuretyApp.registerAirline(account, {from: config.firstAirline});

        let isAirline = await config.flightSuretyData.isAirline.call(account);
        let isActive = await config.flightSuretyData.isAirlineActive.call(account);

        assert.equal(isAirline, true, "Airline should be registered on initial auto register");
        assert.equal(isActive, false, "Airline should be inactive until it sends funds");
    }

    let airlinesLen = await config.flightSuretyData.airlinesLength();
    assert.equal(airlinesLen, config.auto_approved_airlines, "Invalid airlines list length");
  });

  it("(airline) register vote", async () => {
    let airlinesLen = parseInt(await config.flightSuretyData.airlinesLength());
    let account = accounts[airlinesLen + 1];

    await config.flightSuretyApp.registerAirline(account, {from: config.firstAirline});
    let isAirline = await config.flightSuretyData.isAirline.call(account);
    let isActive = await config.flightSuretyData.isAirlineActive.call(account);
    let afterLen = await config.flightSuretyData.airlinesLength();

    assert.equal(isAirline, false, "Fifth Airline should be registered with 50% consensus");
    assert.equal(isActive, false, "Airline should be inactive until it sends funds");
    assert.equal(afterLen, airlinesLen, "Invalid airlines list length");
  });

  it("(airline) register vote duplicated", async () => {
    let airlinesLen = await config.flightSuretyData.airlinesLength();
    let account = accounts[airlinesLen + 1];
    let raised = false;

    try {
        await config.flightSuretyApp.registerAirline(account, {from: config.firstAirline});
    } catch(e) {
        raised = true;
    }
    
    assert.equal(raised, true, "Airline should vote only once");
  });

  it("(airline) register 50% consensus", async () => {
    const FIRST_VOTER = 1;
    let airlinesLen = parseInt(await config.flightSuretyData.airlinesLength());
    let account = accounts[airlinesLen + 1];
    // greater than 50% considering airline registered on contract deployment
    let consensus = Math.round(airlinesLen / 2);
    let funds = web3.utils.toWei(config.airline_ante.toString(), "ether");

    for (let i = 0; i < consensus; i++) {        
        let voter = accounts[i + FIRST_VOTER]; 
        
        await config.flightSuretyApp.fund({from: voter, value: funds});
        await config.flightSuretyApp.registerAirline(account, {from: voter});
    }

    let isAirline = await config.flightSuretyData.isAirline.call(account);
    let isActive = await config.flightSuretyData.isAirlineActive.call(account);

    assert.equal(isAirline, true, "Airline should be registered after 50% consensus");
    assert.equal(isActive, false, "Airline should be inactive until it sends funds");

    let afterLen = await config.flightSuretyData.airlinesLength();
    assert.equal(afterLen, airlinesLen + 1, "Invalid airlines list length");
  });
});
