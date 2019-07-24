pragma solidity >=0.5.0 <0.6.0;
import "./../app/node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";

contract SimpleExchange {
    
    ERC721Full public token;
    
    mapping(uint => uint) orderBook;

    event TokenListed(
        uint indexed _tokenId,
        uint indexed _price
    );

    event TokenSold(uint indexed _tokenId, uint indexed _price);

    constructor(address _tokenAddress) public {
        token = ERC721Full(_tokenAddress);
    }

    function listToken(uint _tokenId, uint _price) public {
        // check if msg.sender owns the token
        address owner = token.ownerOf(_tokenId);
        require(owner == msg.sender, "Unauthorized");

        // check if the exchange contract has approval
        require(token.isApprovedForAll(owner, address(this)), "Not approved");

        //list token
        orderBook[_tokenId] = _price;

        emit TokenListed(_tokenId, _price);
    }

    function validBuyOrder(uint _tokenId, uint _price) private view returns(bool){
        require(orderBook[_tokenId] > 0, "No order");
        return (orderBook[_tokenId] <= _price);
    }

    function markTokenAsSold(uint _tokenId) private{
        orderBook[_tokenId] = 0;
    }

    function listingPrice(uint _tokenId) public view returns(uint){
        return orderBook[_tokenId];
    }

    function buyToken(uint _tokenId) public payable {
        // validate the purchase order
        require(validBuyOrder(_tokenId, msg.value), "No order available");
        // transfer money to owner
        address owner = token.ownerOf(_tokenId);
        address payable payableOwner = address(uint160(owner));
        payableOwner.transfer(msg.value);
        // transfer token to buyer
        uint _price = orderBook[_tokenId];
        token.safeTransferFrom(owner, msg.sender, _tokenId);
        markTokenAsSold(_tokenId);
        emit TokenSold(_tokenId, _price);
    }
}
