object "ERC20" {
	code {
    sstore(0x18160ddd, 0x00)
    sstore(0x06fdde03, 0x45544f4b454e)
    sstore(0x95d89b41, 0x4554)
    sstore(0x313ce567, 0x12)

		datacopy(0, dataoffset("runtime"), datasize("runtime"))
		return(0, datasize("runtime"))
	}    
    object "runtime" {
      code {
      /* MAPPING */
      let BALANCE_OF_MAPPING := 0xe2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e
      let ALLOWANCE_MAPPING := 0x1580adec6c68dea5886da953e9eca5c239ae00896b3de5d55248d60b547ea9d8

      /* EVENT */
      let TRANSFER_EVENT := 0x78d8af3b0529fcbf811085c11d77397246827610c4f2840fcd551f131644bd3a
      let APPROVAL_EVENT := 0x5f5567e8b0216a6da2ad6f0c64414036c3d7629078311dab3400b5e762d00148
      
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
      case 0x313ce567 /* decimals */ {
        let decimals := sload(0x313ce567)
        mstore(0x00, decimals)
        return(0x00, 0x20)
      }
      default {
        revert(0, 0)
      }
    }
	}
}
