pragma solidity ^0.4.18;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library StringUtils {
    // internal function to compare strings
    function equal(string storage _a, string memory _b) internal view returns (bool){
        bytes storage a = bytes(_a);
        bytes memory b = bytes(_b);
        if (a.length != b.length)
    			return false;
        // @todo unroll this loop
        for (uint i = 0;
        i < a.length;
        i ++){
            if (a[i] != b[i])
    				return false;
        }
        return true;
    }
}


