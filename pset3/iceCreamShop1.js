const priceOfIceCream = 5;

let paymentRecieved = prompt("How much money do you have?");

let isPaymentEnough = paymentRecieved >= priceOfIceCream;

if (isPaymentEnough){
    print("Thanks! Enjoy the Ice Cream!")
} else {
    print("Not enough cash!")
}

if (paymentRecieved > priceOfIceCream){
    print("Your change:")
    print(paymentRecieved - priceOfIceCream)
}