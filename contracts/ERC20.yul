object "ERC20" {
	code {
    sstore(0x18160ddd, 0x00)
    sstore(0x06fdde03, 0x45544f4b454e)
    sstore(0x95d89b41, 0x4554)

		datacopy(0, dataoffset("runtime"), datasize("runtime"))
		return(0, datasize("runtime"))
	}

    //   event Transfer(address indexed from, address indexed to, uint256 value);
    // event Approval(
    //     address indexed owner, address indexed spender, uint256 value
    // );

    // uint256 public totalSupply;
    // mapping(address => uint256) public balanceOf;
    // mapping(address => mapping(address => uint256)) public allowance;
    // string public name;
    // string public symbol;
    // uint8 public decimals;

	object "runtime" {
    code {
      
      let selector := shr(224, calldataload(0))

      switch selector

      case 0x18160ddd /* totalSupply() */ {
        let totalSupply := sload(0x18160ddd)
        mstore(0x00, totalSupply)
        return(0x00, 0x20)
      }
      case 0x06fdde03 /* name() */ {
        let name := sload(0x06fdde03)
        mstore(0x00, name)
        return(0x00, 0x20)
      }
      case 0x95d89b41 /* symbol() */ {
        let symbol := sload(0x95d89b41)
        mstore(0x00, symbol)
        return(0x00, 0x20)
      } 
      default {
        revert(0, 0)
      }
    }
	}
}
