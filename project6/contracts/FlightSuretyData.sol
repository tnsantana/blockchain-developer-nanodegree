pragma solidity >=0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct Airline {
        bool active;
        bool registered;
    }

    // struct Passenger {
    // }

    mapping(address => bool) private authorizedCallers;
    mapping(address => Airline) private airlines;
    uint256 private airlinesLen;
    // mapping(address => Passenger) private passengers;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public
    {
        contractOwner = msg.sender;
        airlines[contractOwner] = Airline({registered: true, active: false});
        airlinesLen = 1;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedCaller()
    {
        require(authorizedCallers[msg.sender], "Unauthorized Caller");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational() public view returns(bool)
    {
        return operational;
    }


    function authorizeCaller(address caller) public requireContractOwner
    {
        authorizedCallers[caller] = true;
    }


    function revokeAuthorizedCaller(address caller) public requireContractOwner
    {
        delete authorizedCallers[caller];
    }


    function isAirline(address airline) public view returns(bool)
    {
        if (airlines[airline].registered) {
            return true;
        }

        return false;
    }


    function isAirlineActive(address airline) public view returns(bool)
    {
        if (airlines[airline].active) {
            return true;
        }

        return false;
    }


    function airlinesLength() public view returns(uint256)
    {
        return airlinesLen;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode) external requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(address airline) external requireAuthorizedCaller
    {
        // require(isAirline(msg.sender), "Allowed for Airlines only");

        airlines[airline] = Airline({registered: true, active: false});
        airlinesLen++;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy(uint256 amount) external payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees() external pure
    {
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external pure
    {
    }

    function fund(address sender) public payable requireAuthorizedCaller
    {
        airlines[sender].active = true;
        // TODO: emit airlined activated
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable requireAuthorizedCaller
    {
        require(msg.data.length == 0, "Fallback allowed to receive ether");
        
        fund(msg.sender);
    }
}
