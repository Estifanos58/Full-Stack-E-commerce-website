import React from 'react'
import './Navbar.css'
import navlogo from '../../assets/Admin_Assets/nav-logo.svg'
import navprofile from '../../assets/Admin_Assets/nav-profile.svg'

function Navbar() {
  return (
    <div className='navbar'>
        <img src={navlogo} alt="" className="nav-logo" />
        <img src={navprofile} alt=""  className='nav-profile'/>
    </div>
  )
}

export default Navbar