import React, {useEffect, useState} from 'react'
import './ListProduct.css'
import cross_icon from '../../assets/Admin_Assets/cross_icon.png'

function ListProduct() {
    const [allproducts, setAllProducts] = useState([])

    const fetchInfo = async ()=>{
      await fetch('http://localhost:4000/allproducts')
      .then((resp)=>resp.json())
      .then((data)=>{setAllProducts(data)})
    }

    useEffect(()=>{
      fetchInfo();
    },[])

    const remove_product = async (id)=>{
      // id = id.toString()
      await fetch('http://localhost:4000/removeproduct',{
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({id:id})
      })
      console.log(id)
      await fetchInfo()
      alert('Item removed')
    }


  return (
    <div className='list-product'>
        <h1>All Products List</h1>
        <div className="listproduct-format-main">
          <p>Products</p>
          <p>Title</p>
          <p>Old Price</p>
          <p>New Price</p>
          <p>Category</p>
          <p>Remove</p>
        </div>
        <div className="listproduct-allproducts">
          <hr />
          {
            allproducts.map((product,index)=>{
              return<> 
              <div key={product.id} className="listproduct-format-main listproduct-format">
                  <img src={product.image} alt="" className='listproduct-product-icon'/>
                  <p>{product.name}</p>
                  <p>${product.old_price}</p>
                  <p>${product.new_price}</p>
                  <p>{product.category}</p>
                  {/* {console.log(product)} */}
                  <img onClick={()=>{remove_product(product.id)}} src={cross_icon} alt="" className='listproduct-remove-icon'/>
              </div>
              <hr />
              </>
            })
          }
        </div>
    </div>
  )
}

export default ListProduct