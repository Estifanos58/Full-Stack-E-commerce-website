const port = 4000;  // created the port
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer'); // A middleware for handling file uploads, such as images.
const path = require('path')

const app = express();  // initiated the express server
app.use(express.json()); // middleware to read and parse JSON request bodies
app.use(cors()); // middleware for handling cross-origin requests


// connecting to database
mongoose.connect("mongodb+srv://estifkebe:E-commerce@cluster0.to8at.mongodb.net/E-commerce") // connect to mongodb

//API creation
app.get('/', (req,res)=>{ 
    res.send('Server id Running')
})

//Image Storage Engine
const storage = multer.diskStorage({  // this will create the multer storage to store the image
    destination: (req, file, cb) => {
        cb(null, './upload/images'); // Ensure this folder exists
    },
    filename : (req, file, cb)=>{
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`) // this will create the filename 'product_176945944.png' 
    }
})
const upload = multer({storage:storage});  // this will initiate multer to 

//Creating upload Endpoint for image upload

app.use('/images', express.static('upload/images'))

app.post('/upload', (req, res) => {
    upload.single('product')(req, res, (err) => {
        if (err) {
            return res.status(500).json({ success: 0, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: 0, message: "No file uploaded" });
        }
        res.json({
            success: 1,
            image_url: `http://localhost:${port}/images/${req.file.filename}`
        });
    });
})

//Schema for Creating Products

const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required: true,
    },
    name:{
        type: String,
        required: true
    },
    image:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        required: true
    },
    new_price:{
        type: Number,
        required: true
    },
    old_price:{
        type: Number,
        required: true
    },
    date: {
        type: Number,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true
    } 
})


// Creating AddProduct API
app.post('/addproduct', async (req,res)=>{
    const products = await Product.find({})
    let id;
    if (products.length > 0) {
        let last_product = products[products.length - 1]; // get the last product
        id = last_product.id + 1; // increment the id
    } else {
        id = 1; // start with 1 if no products exist
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price
    })
    console.log(product)
    await product.save()
    console.log('saved')
    res.json({
        success: true,
        name : req.body.name
    })
})



// Creating API for deleting product
app.delete('/removeproduct', async (req, res) => {
    try {
        const id  = req.body.id;  // Extract _id from the request body
        await Product.deleteOne({'id': id});  // Use _id for deletion
        console.log('Product removed');
        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});


// Get All Product API
app.get('/allproducts', async (req, res)=>{
    let products = await Product.find({})
    console.log('All Products Fetched')
    res.send(products)
}) 

// Schema for Creating User
const user = mongoose.model("user",{
    name:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    cartData: {
        type: Object
    },
    date:{
        type: Number,
        default: Date.now
    }
})

// Creating Endpoint for User Registration
app.post('/signup', async(req, res)=>{
    let check = await user.findOne({email: req.body.email})
    if(check){
        return res.status(400).json({success: false, error: 'Email already exists'})
    }
    let cart = {};
    for (let index = 0; index < 300; index++) {
        cart[index] = 0;
    }
    const newUser = new user({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart
    });
    await newUser.save()

    const data = {
        user: {
            id: newUser.id,
        }
    } 
    const token = jwt.sign(data, 'secret_ecom')
    res.json({success: true, token: token})
})

// creating endpoint for user login
app.post('/login', async(req,res)=>{
    const existUser = await user.findOne({email: req.body.email})
    if(existUser){
        const passCompare = req.body.password === existUser.password;
        if(passCompare){
            const data = {
                user: {
                    id: existUser.id,
                }
            }
            const token = jwt.sign(data,'secret_ecom')
            res.json({success: true, token: token})
        }
        else{
            res.json({ success: false, error: 'Password is incorrect'})
        }
    }
    else{
        res.json({success: false, error: 'Wrong Email'})
    }
})

// Creating End point for newCollection data
app.get('/newcollections', async (req, res) => {
    try {
        let products = await Product.find({}).sort({ date: -1 }).limit(10); // Fetch the latest 10 products
        console.log('New Collection Fetched');
        res.send(products);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Creating End Point for Popular in Women section
app.get('/popularwomen', async (req, res) => {
    try{
        let products = await Product.find({category: 'women'});
        let popular_in_women = products.slice(0,4);
        console.log('Popular in women fetched');
        res.send(popular_in_women);


    }catch(error){
        console.log(error.message)
    }
})

// Creating middleware to fetch user
    const fetchUser = async (req, res, next)=>{
        const token = req.header('auth-token');
        if(!token) {
            res.status(401).send({errors: 'Please authenticate using valid token'});
        }
        else{
            try{
                const data = jwt.verify(token, 'secret_ecom');
                req.user = data.user;
                next()
            }catch(error){
                res.status(401).send({errors: 'please authenticate using a valid token'})
            }
        }
    }

// Creating End Point for adding to cart
app.post('/addtocart', fetchUser, async (req, res) => {
    try {
        let userData = await user.findOne({ _id: req.user.id });
        console.log('userData' + userData)

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the item exists in the cart, if not initialize it
        if (!userData.cartData[req.body.itemId]) {
            userData.cartData[req.body.itemId] = 1;  // Initialize item count to 1
        } else {
            userData.cartData[req.body.itemId]++;  // Increment item count
        }

        // Save the updated cart to the database
        await user.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });

        res.json({ success: true, message: "Item added to cart" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Creating End point to remove product from cartdat
app.delete('/removefromcart', fetchUser, async (req, res)=>{
    console.log('removed', req.body.itemId)
    let userData = await user.findOne({_id: req.user.id});
    if(userData.cartData[req.body.itemId] > 0)
        userData.cartData[req.body.itemId] -=1;
    await user.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData})
    res.json({ success: true, message: "Item deleted to cart" });

})
// Creating End poin to get all Data
app.post('/getcart', fetchUser, async(req,res)=>{
    console.log('getcart')
    let userData = await user.findOne({_id:req.user.id})
    res.json(userData.cartData)
})



app.listen(port, (error)=>{
    if(!error){
        console.log('Server is Running at Port ' + port)
    }
    else {
        console.log(error.message)
    }
})