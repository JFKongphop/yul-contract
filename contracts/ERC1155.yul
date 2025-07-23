object "ERC1155" {
	code {
		datacopy(0, dataoffset("runtime"), datasize("runtime"))
		return(0, datasize("runtime"))
	}    
  object "runtime" {
    code {
      // owner => id => balance
      // cast keccak "mapping(address => mapping(uint256 => uint256)) public balanceOf"
      let BALANCE_OF_MAPPING := 0x5a38e96a01c1d2f3c282045ff2beccf32b7e5111c10b76a1d8e4c50e8eecfcac

      // owner => operator => approved
      // cast keccak "mapping(address => mapping(address => bool)) public isApprovedForAll"
      let IS_APPROVED_FOR_ALL := 0xe3a0a1c41f8eca9fc64abbe69255a8a38b179452591c795d1dedf96d1d54bbf2


      let selector := shr(224, calldataload(0))
  
      switch selector

      case 0x00fdd58e /* balanceOf(address,uint256) */ {
        let owner := decodeAsAddress(0)
        let id := decodeAsUint(1)
        let userBalanceOf := balanceOf(owner, id, BALANCE_OF_MAPPING)

        returnBytes32(userBalanceOf)
      }

      case 0x156e29f6 /* mint(address,uint256,uint256) */ {
        let to := decodeAsAddress(0)
        let id := decodeAsUint(1)
        let value := decodeAsUint(2)

        mint(to, id, value, BALANCE_OF_MAPPING)
      }

      case 0x4e1273f4 /* balanceOfBatch(address[], uint256[]) */ {
        let owners := decodeAsUint(0)
        let ids := decodeAsUint(1)

        let balanceMemorySize := balanceOfBatch(owners, ids, BALANCE_OF_MAPPING)

        returnArray(balanceMemorySize)
      }

      default {
        // cast --format-bytes32-string "INVALID FUNCTION"
        let error := 0x494e56414c49442046554e4354494f4e00000000000000000000000000000000
        revertError(error)
      }

      /*******************************/
      /*** READ INTERNAL FUNCTION  ***/
      /*******************************/
      
      function balanceOf(owner, id, memory) -> b {
        b := getNestedMapping(owner, id, memory)
      }

      function balanceOfBatch(owners, ids, memory) -> balanceMemorySize {
        let ownerSize, ownerIndex := decodeAsArray(owners)
        let idSize, idIndex := decodeAsArray(ids)

        lengthMismatchChecker(ownerSize, idSize)

        let memoryIndex := 0x00
        for { let i := 0 } lt(i, ownerSize) { i := add(i, 1) } {
          let ownerData := calldataload(ownerIndex)
          let idData := calldataload(idIndex)

          let userBalanceOf := balanceOf(ownerData, idData, memory)

          mstore(memoryIndex, userBalanceOf)
          memoryIndex := add(memoryIndex, 0x20)

          ownerIndex := add(ownerIndex, 0x20)
          idIndex := add(idIndex, 0x20)
        }

        balanceMemorySize := memoryIndex
      }
      
      function isApprovedForAll(sender, operator, memory) -> approvalForAll {
        approvalForAll := getNestedMapping(sender, operator, memory)
      }

      /*******************************/
      /*** WRITE INTERNAL FUNCTION ***/
      /*******************************/

      function mint(to, id, value, memory) {
        zeroAddressChecker(to)
        
        let currentBalance := balanceOf(to, id, memory)
        let newBalance := add(currentBalance, value)
        setBalanceOf(to, id, value, memory)

        emitTransferSingle(caller(), address(), to, id, value)
      }

      function setBalanceOf(owner, id, tokenBalance, memory) {
        setNestedMapping(owner, id, tokenBalance, memory)
      }

      function setApprovalForAll(sender, operator, approved, memory) {
        setNestedMapping(sender, operator, approved, memory)

        emitApprovalForAll(sender, operator, approved)
      }

      /*******************************/
      /***  PARAM HELPER FUNCTION  ***/
      /*******************************/
  
      function decodeAsAddress(offset) -> value {
        value := decodeAsUint(offset)
        if iszero(iszero(and(value, not(0xffffffffffffffffffffffffffffffffffffffff)))) {
          revert(0, 0)
        }
      }
  
      function decodeAsUint(offset) -> value {
        let pos := add(4, mul(offset, 0x20))
        if lt(calldatasize(), add(pos, 0x20)) {
          revert(0x00, 0x00)
        }
        value := calldataload(pos)
      }

      function decodeAsArray(ptr) -> size, firstElementIndex {
        size := calldataload(add(4, ptr))
        if lt(calldatasize(), add(ptr, mul(size, 0x20))) {
          revert(0x00, 0x00)
        }
        firstElementIndex := add(36, ptr)
      }
      
      /*******************************/
      /*** MAPPING HELPER FUNCTION ***/
      /*******************************/

      function getNestedMapping(key1, key2, memory) -> value {
        let ptr := 0x80

        mstore(ptr, key1)
        mstore(add(ptr, 0x20), memory)
        let slot1 := keccak256(ptr, 0x40)

        mstore(ptr, key2)
        mstore(add(ptr, 0x20), slot1)
        let slot2 := keccak256(ptr, 0x40)

        value := sload(slot2)
      }

      function setNestedMapping(key1, key2, value, memory) {
        mstore(0x00, key1)
        mstore(0x20, memory)
        let slot1 := keccak256(0x00, 0x40)

        mstore(0x00, key2)
        mstore(0x20, slot1)
        let slot2 := keccak256(0x00, 0x40)

        sstore(slot2, value)
      }

      function returnBytes32(value) {
        mstore(0x00, value)
        return(0x00, 0x20)
      }

      function returnArray(arrayMemorySize) {
        return(0x00, arrayMemorySize)
      }

      function revertError(message) {
        mstore(0x00, message)
        revert(0x00, 0x20)
      }

      function zeroAddressChecker(account) {
        if eq(account, 0x00) {
          // cast --format-bytes32-string "ZERO_ADDRESS"
          let error := 0x5a45524f5f414444524553530000000000000000000000000000000000000000
          revertError(error)
        }
      }

      function lengthMismatchChecker(lengthA, lengthB) {
        if iszero(eq(lengthA, lengthB)) {
          // cast --format-bytes32-string "LENGTH_MISMATCH"
          let error := 0x4c454e4754485f4d49534d415443480000000000000000000000000000000000
          revertError(error)
        }
      }

      /*******************************/
      /***  EVENT HELPER FUNCTION  ***/
      /*******************************/

      function emitTransferSingle(operator, from, to, id, value) {
        // cast keccak "TransferSingle(address,address,address,uint256,uint256)"
        let hash := 0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62
        
        mstore(0x00, id)
        mstore(0x20, value)
        log4(0x00, 0x40, hash, operator, from , to)
      }

      function emitTransferBatch(operator, from, to, memorySize) {
        // cast keccak "TransferBatch(address,address,address,uint256[],uint256[])"
        let hash := 0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb

        log4(0x00, memorySize, hash, operator, from, to)
      }

      function emitApprovalForAll(owner, operator, approved) {
        // cast keccak "ApprovalForAll(address,address,bool)"
        let hash := 0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31
        
        mstore(0x00, approved)
        log3(0x00, 0x20, hash, owner, operator)
      }
    }
  }
}