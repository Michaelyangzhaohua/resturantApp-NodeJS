# [PIADA ITALIAN FOOD: An Italian Restaurant Web Application](https://github.com/Michaelyangzhaohua/resturantApp-NodeJS "PIADA ITALIAN FOOD: An Italian Restaurant Web Application")

## Introduction
Our project is a web application for an Italian restaurant called &quot;Piada Italian Food&quot;. This web application allows customers to order food online, such as the various kinds of pasta, beverages, etc. The menu is accessible for everyone, and you can filter the dishes based on your input or the selected dish type. To make an order, an account is needed. By registering an account and logging in, customers will be able to put their favorite dishes into their wishlists or shopping carts. Customers are allowed to edit the number of dishes or remove dishes from the cart. Once an order is made, the price will be calculated and the customer can review the order history in the profile. The administrator account is able to add, edit, remove, and recover the dishes. Besides, the administrator has access to check all the order history from the database.



## Frameworks & Tools
- [Node.js](https://nodejs.org/en/ "Node.js"): an open-source, cross-platform, JavaScript runtime environment that executes JavaScript code outside of a web browser.
- [Express.js](https://expressjs.com/ "Express.js"): a web application framework for Node.js.
- [Nodemon](https://nodemon.io/ "Nodemon"): a utility that will monitor for any changes in your source and automatically restart your server.
- [MongoDB](https://www.mongodb.com/ "MongoDB"): a cross-platform document-oriented database program.
- [Monk](https://automattic.github.io/monk/ "Monk"): A tiny layer that provides simple yet substantial usability improvements for MongoDB usage within Node.JS.
- [Robo 3T](https://robomongo.org/ "Robo 3T"): a shell-centric cross-platform MongoDB management tool.



## Steps
### Deploy database:
To use our application, the database should be deployed at port `27017`. Initially it only needs one document in one database. The name of the database is `restaurant`. The name of the table is `menus`. To get the content of the `menus` table, the JSON file is located at `./menus.json`.

### Run the application:
Use these commands:
```bash
$ git clone https://github.com/Michaelyangzhaohua/resturantApp-NodeJS.git
$ cd resturantApp-NodeJS/
$ npm install
$ nodemon
```
After typing these commands in the terminal, you will be able to try our application from `localhost:3000`.

### Set up an administrator account
After the registration, by default the account will be a normal account. To obtain administrator's permission, the only way would be changing the `isAdmin` property from the `accounts` table.



## When testing the administrator's functions (especially "Adding new dish")
We already have a sample for you.  From `./Data For Testing/` folder, you can find the sample information of a new dish (`menus_add.json`), including the image file. Following the instruction of the &quot;Adding new dish&quot; page, you will be able to add a new dish to the menu and the database.



## What else
- You can find some JSON dump files from our previous test run at `./MongoDB JSON Files/`.
- You can check our implementation timeline at `./WorkingProgress.md`.