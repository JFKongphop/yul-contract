object "ERC20" {
	code {
    sstore(0x18160ddd, 0x00)
    sstore(0x06fdde03, 0x45544f4b454e)
    sstore(0x95d89b41, 0x4554)
    sstore(0x313ce567, 0x12)
    sstore(0xa035b1fe, 0xf4240)

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
        returnStorageData(0x18160ddd)
      }
      case 0x06fdde03 /* name() */ {
        returnStorageData(0x06fdde03)
      }
      case 0x95d89b41 /* symbol() */ {
        returnStorageData(0x95d89b41)
      } 
      case 0x313ce567 /* decimals() */ {
        returnStorageData(0x313ce567)
      }
      case 0xa035b1fe /* price() */ {
        returnStorageData(0xa035b1fe)
      }
      case 0x1249c58b /* mint() */ {
        let from := caller()
        let amount := callvalue()

        if iszero(amount) {
          revertError(INVALID_VALUES_ERROR())
        }

        let price := getStorageData(0xa035b1fe)
        let overValue := mod(amount, price)
        let tokenAmount := div(sub(amount, overValue), price)

        mstore(0x00, from)
        mstore(0x20, BALANCE_OF_MAPPING)
        let slot := keccak256(0x00, 0x40)
        sstore(slot, tokenAmount)

        let totalSupply := getStorageData(0x18160ddd)
        sstore(0x18160ddd, add(totalSupply, tokenAmount))

        mstore(0x00, tokenAmount)
        log3(0x00, 0x20, TRANSFER_EVENT, from, address())
      }

      default {
        revert(0, 0)
      }

      /* FUNCTION */
      // function mint() {
      //   let from := caller()
      //   let amount := callvalue()

      //   if iszero(amount) {
      //     revertError(INVALID_VALUES_ERROR())
      //   }

      //   let price := getStorageData(0xa035b1fe)
      //   let overValue := mod(amount, price)
      //   let tokenAmount := div(sub(amount, overValue), price)

      //   mstore(0x00, from)
      //   mstore(0x20, USER_BALANCE_MAPPING)
      //   let slot := keccak256(0x00, 0x40)
      //   sstore(slot, tokenAmount)

      //   let totalSupply := getStorageData(0x18160ddd)
      //   sstore(0x00, add(totalSupply, tokenAmount))


      //   mstore(0x00, tokenAmount)
      //   log3(0x00, 0x20, TRANSFER_EVENT, from, address())
      // } 

      /* PARAMETER MANAGERMENT*/
      function addressParam(offset) -> v {
        v := uintParam(offset)
        if iszero(iszero(and(v , not(0xffffffffffffffffffffffffffffffffffffffff)))) {
          revertError(INVALID_PARAMS_ERROR())
        }
      }

      function uintParam(offset) -> v {
        let pos := add(4, mul(offset, 0x20))
        if lt(calldatasize(), add(pos, 0x20)) {
          revertError(INVALID_PARAMS_ERROR())
        }
        v := calldataload(pos)
      }

      /* RETURN STORAGE DATA */
      function returnStorageData(pos) {
        let storageData := sload(pos)
        mstore(0x00, storageData)
        return(0x00, 0x20)
      }

      function getStorageData(pos) -> v {
        v := sload(pos)
      }

      function revertError(message) {
        mstore(0x00, message)
        revert(0x00, 0x20)
      }

      /* ERROR */
      function INVALID_PARAMS_ERROR() -> e {
        e := 0x496e76616c696420706172616d73
      }

      function INVALID_VALUES_ERROR() -> e {
        e := 0x496e76616c69642076616c756573
      }
    }
	}
}
