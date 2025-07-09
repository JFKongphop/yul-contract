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
      let IS_APPROVED_FOR_ALL_MAPPING := 0xc67395a334e08439b916a88681a315e5e89e6c3680d12ded9795ab61bd8ca9e1

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
        let id := calldataload(0x04)
        let ownerAddress := ownerOf(id, OWNER_OF_MAPPING)

        mstore(0x00, ownerAddress)
        return(0x00, 0x20)
      }

      case 0x70a08231 /* balanceOf(address) */ {
        let userAddress := calldataload(0x04)

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
        let from := calldataload(0x04)
        let to := calldataload(0x24)
        let id := calldataload(0x44)

        let ownerTokenId := getMapping(id, OWNER_OF_MAPPING)

        if iszero(eq(ownerTokenId, from)) {
          revertError(INVALID_BALANCE_ERROR())
        }

        if iszero(not(eq(to, 0x00))) {
          revertError(INVALID_VALUES_ERROR())
        }

        let spender := caller()

        let ownerEqual := eq(from, spender)
        let approvedForAll := isApprovedForAll(from, spender, IS_APPROVED_FOR_ALL_MAPPING)
        let spenderApproval := iszero(eq(spender, getApprove(id, APPROVAL_MAPPING)))

        let status := eq(ownerEqual, eq(approvedForAll, spenderApproval))
        
        if iszero(status) {
          revertError(INVALID_VALUES_ERROR())
        }

        let currentFromBalance := getBalanceOf(from, BALANCE_OF_MAPPING)
        let newFromBalance := sub(currentFromBalance, 0x01)
        setBalanceOf(from, newFromBalance, BALANCE_OF_MAPPING)

        let currentToBalance := getBalanceOf(to, BALANCE_OF_MAPPING)
        let newToBalance := add(currentToBalance, 0x01)
        setBalanceOf(to, newToBalance, BALANCE_OF_MAPPING)

        let latestToBalance := getBalanceOf(to, BALANCE_OF_MAPPING)

        setMapping(id, to, OWNER_OF_MAPPING)
        setApprove(id, 0x00, APPROVAL_MAPPING)

        log4(0x00, 0x00, TRANSFER_EVENT, from, to, id)
      }

      case 0xa22cb465 /* setApprovalForAll(address,bool) */ {
        let operator := calldataload(0x04)
        let approved := calldataload(0x24)

        let owner := caller()

        mstore(0x00, owner)
        mstore(0x20, IS_APPROVED_FOR_ALL_MAPPING)
        let innerApprovedForAll := keccak256(0x00, 0x40)

        mstore(0x00, operator)
        mstore(0x20, innerApprovedForAll)
        
        let outerSlot := keccak256(0x00, 0x40)
        sstore(outerSlot, approved)

        mstore(0x00, approved)
        log3(0x00, 0x20, APPROVAL_FOR_ALL_EVENT, owner, operator)
      }

      case 0xe985e9c5 /* isApprovedForAll(address,address) */ {
        let owner := calldataload(0x04)
        let operator := calldataload(0x24)

        let approved := isApprovedForAll(owner, operator, IS_APPROVED_FOR_ALL_MAPPING)

        mstore(0x00, approved)
        return(0x00, 0x20)
      }

      case 0x095ea7b3 /* approve(address,uint256) */ {
        let spender := calldataload(0x04)
        let id := calldataload(0x24)
        let from := caller()
        let owner := ownerOf(id, OWNER_OF_MAPPING)

        let ownerEqual := eq(from, owner)
        let approved := isApprovedForAll(owner, from, IS_APPROVED_FOR_ALL_MAPPING)
        
        if iszero(eq(ownerEqual, approved)) {
          revertError(INVALID_VALUES_ERROR())
        }

        setApprove(id, spender, APPROVAL_MAPPING)

        log4(0x00, 0x00, APPROVAL_MAPPING, owner, spender, id)
      }

      case 0x081812fc /* getApproved(uint256)*/ {
        let id := calldataload(0x04)

        let approveAddress := getApprove(id, APPROVAL_MAPPING)

        mstore(0x00, approveAddress)
        return(0x00, 0x20)
      }

      // case 0x72982cd2 /* isApprovedOrOwner(address,address,uint256) */ {
      //   let owner := calldataload(0x04)
      //   let spender := calldataload(0x24)
      //   let id := calldataload(0x44)

      //   let approved := isApprovedForAll(owner, spender, IS_APPROVED_FOR_ALL_MAPPING)


      //   // let isApprovedForAll = getMapping()

      // }

      case 0x42966c68 /* burn(uint256) */ {
        
      }

      default {
        revert(0, 0)
      }

      function getBalanceOf(user, memory) -> ownerBalance {
        ownerBalance := getMapping(user, memory)
      }
      
      function setBalanceOf(user, balanceOf,  memory) {
        setMapping(user, balanceOf, memory)
      }

      function ownerOf(id, memory) -> ownerAddress {
        ownerAddress := getMapping(id, memory)
      }

      function setApprove(id, spender, memory) {
        setMapping(id, spender, memory)
      }

      function getApprove(id, memory) -> approveAddress {
        approveAddress := getMapping(id, memory)
      }

      function isApprovedForAll(owner, operator, memory) -> value {
        mstore(0x00, owner)
        mstore(0x20, memory)
        let innerApprovedForAll := keccak256(0x00, 0x40)

        mstore(0x00, operator)
        mstore(0x20, innerApprovedForAll)
        
        let outerSlot := keccak256(0x00, 0x40)

        value := sload(outerSlot)
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
