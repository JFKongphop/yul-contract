object "ERC1155" {
	code {
		datacopy(0, dataoffset("runtime"), datasize("runtime"))
		return(0, datasize("runtime"))
	}    
  object "runtime" {
    code {
      // owner => id => balance
      // cast keccak "mapping(address => mapping(uint256 => uint256)) public balanceOf"
      let BALANCE_OF := 0x5a38e96a01c1d2f3c282045ff2beccf32b7e5111c10b76a1d8e4c50e8eecfcac

      // owner => operator => approved
      // cast keccak "mapping(address => mapping(address => bool)) public isApprovedForAll"
      let IS_APPROVED_FOR_ALL := 0xe3a0a1c41f8eca9fc64abbe69255a8a38b179452591c795d1dedf96d1d54bbf2

      let selector := shr(224, calldataload(0))
  
      switch selector

      case 0x00fdd58e /* balanceOf(address,uint256) */ {
        let owner := decodeAsAddress(0)
        let id := decodeAsUint(1)
        let userBalanceOf := balanceOf(owner, id, BALANCE_OF)

        returnBytes32(userBalanceOf)
      }

      case 0x156e29f6 /* mint(address,uint256,uint256) */ {
        let to := decodeAsAddress(0)
        let id := decodeAsUint(1)
        let value := decodeAsUint(2)

        mint(to, id, value, BALANCE_OF)
        
        emitTransferSingle(caller(), address(), to, id, value)
      }

      case 0x4e1273f4 /* balanceOfBatch(address[],uint256[]) */ {
        let owners := decodeAsUint(0)
        let ids := decodeAsUint(1)

        let balanceMemorySize := balanceOfBatch(owners, ids, BALANCE_OF)

        returnArray(balanceMemorySize)
      }

      case 0x0ca83480 /* batchMint(address,uint256[],uint256[]) */ {
        let to := decodeAsAddress(0)
        let ids := decodeAsUint(1)
        let values := decodeAsUint(2)

        let arrayMemorySize := batchMint(to, ids, values, BALANCE_OF)

        emitTransferBatch(caller(), 0x00, to, arrayMemorySize)
      }

      case 0xa22cb465 /* setApprovalForAll(address,bool) */ {
        let operator := decodeAsUint(0)
        let approved := decodeAsUint(1)

        setApprovalForAll(caller(), operator, approved, IS_APPROVED_FOR_ALL)

        emitApprovalForAll(caller(), operator, approved)
      }

      case 0xe985e9c5 /* isApprovedForAll(address,address) */ {
        let from := decodeAsAddress(0)
        let operator := decodeAsAddress(1)

        let approvalForAll := isApprovedForAll(from, operator, IS_APPROVED_FOR_ALL)

        returnBytes32(approvalForAll)
      }

      case 0x0febdd49 /* safeTransferFrom(address,address,uint256,uint256) */ {
        let from := decodeAsAddress(0)
        let to := decodeAsAddress(1)
        let id := decodeAsUint(2)
        let value := decodeAsUint(3)

        safeTransferFrom(from, to, id, value, IS_APPROVED_FOR_ALL, BALANCE_OF)

        emitTransferSingle(caller(), from, to, id, value)
      }

      case 0xfba0ee64 /* safeBatchTransferFrom(address,address,uint256[],uint256[]) */ {
        let from := decodeAsAddress(0)
        let to := decodeAsAddress(1)
        let ids := decodeAsUint(2)
        let values := decodeAsUint(3)

        let idSize, idIndex := decodeAsArray(ids)
        let valueSize, valueIndex := decodeAsArray(values)

        let addressMismatch := eq(caller(), from)
        let approved := isApprovedForAll(caller(), from, IS_APPROVED_FOR_ALL) 
        let ownerCondition := or(addressMismatch, approved)

        // cast --format-bytes32-string "NOT_APPROVE"
        let error := 0x4e4f545f415050524f5645000000000000000000000000000000000000000000
        require(ownerCondition, error)

        zeroAddressChecker(to)
        lengthMismatchChecker(idSize, valueSize)


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

        mstore(0x00, 0x20)
        mstore(0x20, idSize)
        let memoryIndex := 0x40
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
      }

      function batchMint(to, ids, values, memory) -> finalMemorySize {
        let idSize, idIndex := decodeAsArray(ids)
        let valueSize, valueIndex := decodeAsArray(values)
      
        zeroAddressChecker(to)
        lengthMismatchChecker(idSize, valueSize)

        finalMemorySize := mul(add(0x40, mul(idSize, 0x20)) ,2)
        let firstArrayMemory := 0x40
        let secondArrayMemory := add(0x40, add(mul(idSize, 0x20), 0x20)) 

        mstore(0x00, firstArrayMemory)
        mstore(0x20, secondArrayMemory)
        mstore(firstArrayMemory, idSize)
        mstore(secondArrayMemory, valueSize)
        
        for { let i := 0 } lt(i, idSize) { i := add(i, 1) } {
          let idData := calldataload(idIndex)
          let valueData := calldataload(valueIndex)
          
          firstArrayMemory := add(firstArrayMemory, 0x20)
          secondArrayMemory := add(secondArrayMemory, 0x20)

          mint(to, idData, valueData, memory)
          
          idIndex := add(idIndex, 0x20)
          valueIndex := add(valueIndex, 0x20)
          
          mstore(firstArrayMemory, idData)
          mstore(secondArrayMemory, valueData)
        }
      }

      function safeTransferFrom(from, to, id, value, approvedMemory, balanceMemory) {
        notApproveChecker(from, approvedMemory)
        zeroAddressChecker(to)

        let currentBalanceFrom := balanceOf(from, id, balanceMemory)
        let newBalanceFrom := sub(currentBalanceFrom, value)
        setBalanceOf(from, id, newBalanceFrom, balanceMemory)

        let currentBalanceTo := balanceOf(to, id, balanceMemory)
        let newBalanceTo := add(currentBalanceTo, value)
        setBalanceOf(to, id, newBalanceTo, balanceMemory)
      }

      function setBalanceOf(owner, id, tokenBalance, memory) {
        setNestedMapping(owner, id, tokenBalance, memory)
      }

      function setApprovalForAll(sender, operator, approved, memory) {
        setNestedMapping(sender, operator, approved, memory)
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
        let ptr := 0x1000

        mstore(ptr, key1)
        mstore(add(ptr, 0x20), memory)
        let slot1 := keccak256(ptr, 0x40)

        mstore(ptr, key2)
        mstore(add(ptr, 0x20), slot1)
        let slot2 := keccak256(ptr, 0x40)

        value := sload(slot2)
      }

      function setNestedMapping(key1, key2, value, memory) {
        let ptr := 0x2000
        
        mstore(ptr, key1)
        mstore(add(ptr, 0x20), memory)
        let slot1 := keccak256(ptr, 0x40)

        mstore(ptr, key2)
        mstore(add(ptr, 0x20), slot1)
        let slot2 := keccak256(ptr, 0x40)

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
        let zeroAddress := iszero(eq(account, 0x00))

        // cast --format-bytes32-string "ZERO_ADDRESS"
        let error := 0x5a45524f5f414444524553530000000000000000000000000000000000000000
        require(zeroAddress, error)
      }

      function lengthMismatchChecker(lengthA, lengthB) {
        let lengthMismatch := eq(lengthA, lengthB)

        // cast --format-bytes32-string "LENGTH_MISMATCH"
        let error := 0x4c454e4754485f4d49534d415443480000000000000000000000000000000000
        require(lengthMismatch, error)
      }

      function addressMismatchChecker(addressA, addressB) {
        let mismatchAddress := eq(addressA, addressB)

        // cast --format-bytes32-string "ADDRESS_MISMATCH"
        let error := 0x414444524553535f4d49534d4154434800000000000000000000000000000000
        require(mismatchAddress, error)
      }

      function notApproveChecker(from, approvedMemory) {
        let addressMismatch := eq(caller(), from)
        let approved := isApprovedForAll(caller(), from, approvedMemory) 
        let ownerCondition := or(addressMismatch, approved)

        // cast --format-bytes32-string "NOT_APPROVE"
        let error := 0x4e4f545f415050524f5645000000000000000000000000000000000000000000
        require(ownerCondition, error)
      }

      function require(condition, error) {
        if iszero(condition) {
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