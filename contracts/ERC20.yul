object "ERC20" {
	code {
		datacopy(0, dataoffset("runtime"), datasize("runtime"))
		return(0, datasize("runtime"))
	}

	object "runtime" {
    code {
      let selector := shr(224, calldataload(0))

      switch selector

      case 0x505fb46c /* add(uint256,uint256,uint256) */ {
        let a := calldataload(4)
        let b := calldataload(36)
        let c := calldataload(68)
        let result := add(add(a, b), c)
        mstore(0x0, result)
        return(0x0, 0x20)
      }
      default {
          revert(0, 0)
      }
    }
	}
}
