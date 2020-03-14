pragma solidity >=0.4.24;

// Import the library 'Roles'
import "./Roles.sol";

// Define a contract 'RetailerRole' to manage this role - add, remove, check
contract RetailerRole {
  using Roles for Roles.Role;

  event RetailerAdded(address indexed account);
  event RetailerRemoved(address indexed account);

  Roles.Role private ratailers;

  constructor() public {
    _addRetailer(msg.sender);
  }

  modifier onlyRetailer() {
    require(isRetailer(msg.sender), "Not a Retailer");
    _;
  }

  function isRetailer(address account) public view returns (bool) {
    return ratailers.has(account);
  }

  function addRetailer(address account) public onlyRetailer {
    _addRetailer(account);
  }

  function renounceRetailer() public {
    _removeRetailer(msg.sender);
  }

  function _addRetailer(address account) internal {
    ratailers.add(account);
    emit RetailerAdded(account);
  }

  function _removeRetailer(address account) internal {
    ratailers.remove(account);
    emit RetailerRemoved(account);
  }
}