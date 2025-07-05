object "ERC721" {
	code {
    sstore(0x009a9b7b, 0x00)

		datacopy(0, dataoffset("runtime"), datasize("runtime"))
		return(0, datasize("runtime"))
	}    
  object "runtime" {
    code {
      /* MAPPING */
      let OWNER_OF_MAPPING := 0xed604959ad6c4ff617f61de52ea4167a084324d152b3837c0497e1dafd716e7a
      let BALANCE_OF_MAPPING := 0x215fa97c078299ea5d7fbc524604832d1cc4ed1cc4f530c7605980f6d2ee8108
      let APPROVAL_MAPPING := 0x374f239b237f5924ec76ae930e13a727f5dac81776df2400d1deef19771bf6e7
      let IS_APPROVED_FOR_ALL := 0xc67395a334e08439b916a88681a315e5e89e6c3680d12ded9795ab61bd8ca9e1

      /* EVENT */
      let TRANSFER_EVENT := 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
      let APPROVAL_EVENT := 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925
      let APPROVAL_FOR_ALL_EVENT := 0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31
      
      let selector := shr(224, calldataload(0))

      switch selector

      case 0x009a9b7b /* currentTokenId() */ {
        returnStorageData(0x009a9b7b)
      }

      case 0x6352211e /* ownerOf(uint256) */ {
        let id := calldataload(4)
        mstore(0x00, id)
        mstore(0x20, OWNER_OF_MAPPING)

        let slot := keccak256(0x00, 0x40)
        let ownerAddress := sload(slot)

        mstore(0x00, ownerAddress)
        return(0x00, 0x20)
      }

      case 0x70a08231 /* balanceOf(address) */ {
        let userAddress := calldataload(4)

        let currentUserBalanceOf := getMapping(userAddress, BALANCE_OF_MAPPING)
        
        mstore(0x00, currentUserBalanceOf)
        return(0x00, 0x20)
      }

      case 0x1249c58b /* mint() */ {
        let user := caller()

        let currentUserBalanceOf := getMapping(user, BALANCE_OF_MAPPING)
        let newUserBalanceOf := add(currentUserBalanceOf, 0x01)
        setMapping(user, newUserBalanceOf, BALANCE_OF_MAPPING)

        let currentTokenId := getStorageData(0x009a9b7b)
        setMapping(currentTokenId, user, OWNER_OF_MAPPING)

        let newTokenId := add(currentTokenId, 0x01)
        sstore(0x009a9b7b, newTokenId)

        log4(0x00, 0x00, TRANSFER_EVENT, address(), user, currentTokenId)
      }

      case 0x23b872dd /* transferFrom(address,address,uint256) */ {
        let from := calldataload(4)
        let to := calldataload(32)
        let id := calldataload(68)

        let ownerTokenId := getMapping(id, OWNER_OF_MAPPING)

        if iszero(eq(ownerTokenId, from)) {
          revertError(INVALID_BALANCE_ERROR())
        }

        if iszero(eq(to, 0x00)) {
          revertError(INVALID_VALUES_ERROR())
        }
      }

      default {
        revert(0, 0)
      }

      function setMapping(key, value, memory) {
        mstore(0x00, key)
        mstore(0x20, memory)
        let slot := keccak256(0x00, 0x40)
        sstore(slot, value)
      }

      function getMapping(key, memory) -> value {
        mstore(0x00, key)
        mstore(0x20, memory)
        let slot := keccak256(0x00, 0x40)
        value := sload(slot)
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

      function INVALID_BALANCE_ERROR() -> e {
        e := 0x496e76616c69642042616c616e6365
      }
    }
	}
}
