
const createChatAgent = () => {

    const CS571_WITAI_ACCESS_TOKEN = "Z3JZCNML2CNCSR4AQ3WI3IQBPDJFJHMR"; // Put your CLIENT access token here.

    let availableItems = [];
    let cart = [];

    const fetchItems = async () => {
        const response = await fetch(`https://cs571.org/api/s24/hw10/items`, {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        })
        const data = await response.json();
        availableItems = data;
        console.log(availableItems);
    }

    const handleInitialize = async () => {
        await fetchItems();
        cart = [
            {
                Apple: 0,
                Bagel: 0,
                Coconut: 0,
                Donut: 0,
                Egg: 0
            }
        ]; 
        return "Welcome to BadgerMart Voice! :) Type your question, or ask for help if you're lost!";
    }

    const handleReceive = async (prompt) => {
        const response = await fetch("https://api.wit.ai/message?v=20240421&q=" + encodeURIComponent(prompt), {
            headers: {
                "Authorization": "Bearer " + CS571_WITAI_ACCESS_TOKEN
            }
        })
        const data = await response.json();
        console.log(data);

        if (data.intents.length > 0) {
            switch(data.intents[0].name) {
                case "get_help": return help(data);
                case "get_items": return getItems(data);
                case "get_price": return getPrice(data);
                case "add_item": return addItem(data);
                case "remove_item": return removeItem(data);
                case "view_cart": return viewCart(data);
                case "checkout": return checkout(data);
            }
        }

        return "Sorry, I didn't get that. Type 'help' to see what you can do!";
    }

    const help = async () => {
        return "In BadgerMart Voice, you can get the list of items, the price of an item, add or remove an item from your cart, and checkout!";
    }

    const getItems = async() => {
        return `We have ${availableItems[0].name}, ${availableItems[1].name}, ${availableItems[2].name}, ${availableItems[3].name}, and ${availableItems[4].name} for sale!`;
    }

    const getPrice = async(promptData) => {
        const hasSpecifiedType = promptData.entities["item:item"] ? true : false;
        const itemType = hasSpecifiedType ? promptData.entities["item:item"][0].value : undefined;

        if (itemType) {
            if (itemType == "apple") return "$" + availableItems[0].price.toFixed(2);
            if (itemType == "bagel") return "$" + availableItems[1].price.toFixed(2);
            if (itemType == "coconut") return "$" + availableItems[2].price.toFixed(2);
            if (itemType == "donut") return "$" + availableItems[3].price.toFixed(2);
            if (itemType == "egg") return "$" + availableItems[4].price.toFixed(2);
        }

        return "Sorry! It seems that the item you are looking for is out of stock.";
    } 

    const addItem = async(promptData) => {
        const hasSpecifiedType = promptData.entities["item:item"] ? true : false;
        const itemType = hasSpecifiedType ? promptData.entities["item:item"][0].value : undefined;
        const hasNumber = promptData.entities["wit$number:number"] ? true : false;
        const number = hasNumber ? promptData.entities["wit$number:number"][0].value: undefined;

        if (itemType) {
            let capitalizedItem = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            if (number && number !== 0) {
                cart[0][capitalizedItem] += Math.floor(number);
                console.log(cart[0]);
                return `Sure, adding ${Math.floor(number)} ${itemType} to your cart.`;
            } else if (number !== 0) {
                cart[0][capitalizedItem] += 1;
                console.log(cart[0]);
                return `Sure, adding 1 ${itemType} to your cart.`;
            } else {
                return "This quantity is invalid.";
            }
        }

        return "Sorry! It seems that the item you are looking for is out of stock.";
    }

    const removeItem = async(promptData) => {
        const hasSpecifiedType = promptData.entities["item:item"] ? true : false;
        const itemType = hasSpecifiedType ? promptData.entities["item:item"][0].value : undefined;
        const hasNumber = promptData.entities["wit$number:number"] ? true : false;
        const number = hasNumber ? promptData.entities["wit$number:number"][0].value: undefined;
        let capitalizedItem = itemType.charAt(0).toUpperCase() + itemType.slice(1);

        if (!itemType) {
            return "You didn't specifiy an item to remove.";
        } else if (!cart[0].hasOwnProperty(capitalizedItem)) {
            return `The item ${itemType} is not in shock.`;
        } else if (number <= 0) {
            return "The quantity is invalid. Please specify a positive number.";
        } else if (cart[0][capitalizedItem] === 0) {
            return `There are no ${itemType}s in your cart to remove.`;
        } else if (number > cart[0][capitalizedItem]) {
            return "The quantity is invalid.";
        } else if (!number) {
            cart[0][capitalizedItem] -= 1;
            return `Removed 1 ${itemType}(s) from your cart.`;
        } else {
            cart[0][capitalizedItem] -= number;
            console.log(cart[0]);
            return `Removed ${number} ${itemType}(s) from your cart.`;
        }
    }

    const viewCart = async () => {
        const purchasedItems = [];
        let totalPrice = 0;

        for (const item in cart[0]) {
            if (cart[0].hasOwnProperty(item) && cart[0][item] > 0) {
                let itemName = item.toLowerCase();
                let count = cart[0][item];

                let itemInfo = availableItems.find(availableItems => availableItems.name === item);
                if (itemInfo) {
                    let itemPrice = itemInfo.price;
                    totalPrice += itemPrice * count;
                    // ChatGPT
                    let description = `${count} ${itemName}${count > 1 ? 's' : ''} at $${itemPrice.toFixed(2)} each`;
                    purchasedItems.push(description);
                }
            }
        }

        if (purchasedItems.length === 0) {
            return "You cart is empty.";
        }

        return `You have ${purchasedItems.join(', ')}. Total price: $${totalPrice.toFixed(2)}.`;
    }

    const checkout = async (promptData) => {
        const cartContents = cart[0];
        const payload = JSON.stringify({
            Apple: cartContents.Apple || 0,
            Bagel: cartContents.Bagel || 0,
            Coconut: cartContents.Coconut || 0,
            Donut: cartContents.Donut || 0,
            Egg: cartContents.Egg || 0,
        });

        const totalQuantity = Object.values(cartContents).reduce((sum, quantity) => sum + quantity, 0);
        if (totalQuantity === 0) {
            return "Cannot checkout, the cart is empty.";
        }

        try {
            const response = await fetch("https://cs571.org/api/s24/hw10/checkout", {
                method: 'POST',
                headers: {
                    "X-CS571-ID": CS571.getBadgerId(),
                    "Content-Type": "application/json"
                },
                body: payload
            });
            const data = await response.json(); 

            if (response.ok) {
                // ChatGPT
                Object.keys(cartContents).forEach(key => cartContents[key] = 0);
                console.log(cartContents);
                return `Successfully purchased! Your confirmation ID is ${data.confirmationId}.`;
            } else {
                console.error("Checkout error:", data.msg);
                return data.msg;
            }
        } catch (error) {
            console.error("Checkout failed:", error);
            return "There was an error processing your checkout. Please try again.";
        }
    }

    return {
        handleInitialize,
        handleReceive
    }    
}

export default createChatAgent;