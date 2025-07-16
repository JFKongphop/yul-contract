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
  
      // switch selector

      function getBalanceOf(owner, id, memory) -> balanceOf {
        balanceOf := getNestedMapping(owner, id, memory)
      }

      function setBalanceOf(owner, id, tokenBalance, memory) {
        setNestedMapping(owner, id, tokenBalance, memory)
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
      
      /*******************************/
      /*** MAPPING HELPER FUNCTION ***/
      /*******************************/

      function getNestedMapping(key1, key2, memory) -> value {
        mstore(0x00, key1)
        mstore(0x20, memory)
        let slot1 := keccak256(0x00, 0x40)

        mstore(0x00, key2)
        mstore(0x20, slot1)
        let slot2 := keccak256(0x00, 0x40)

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