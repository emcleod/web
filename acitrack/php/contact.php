<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <!-- TOOD keywords -->
    <link rel="stylesheet" href="../css/main.css"/>
    <title>Contact Us</title>
    <?php
  
    function generate_form_token($form) {
      $token = md5(uniqid(rand(), true));
      $_SESSION[$form."_token"] = $token;
      return $token;
    }

    function validate_form_token($form) {
      if (!isset($_SESSION[$form."_token"])) {
        return false;
      }
      if (!isset($_POST["token"])) {
        return false;
      }
      if ($_SESSION[$form."_token"] !== $_POST["token"]) {
        return false;
      }
      return true;
    }
      
    function test_input($data) {
      $data = trim($data);
      $data = stripslashes($data);
      $data = htmlspecialchars($data);
      return strip_tags($data);
    }

    $whitelist = array("institutionName", "institutionType", "institutionWebsite", "contactName", "contactEmail", "contactPosition", "contactPhone");
    if (isset($_POST["submit"]) && validate_form_token("form")) {
      $contactName = $contactEmail = $contactPosition = $contactPhone = "";
      $institutionName = $institutionType = $institutionWebsite = "";
      $comment = "";
      
      $contactNameErr = $contactEmailErr = $contactPhoneErr = "";
      $institutionNameErr = $institutionTypeErr = $institutionWebsiteErr = "";
    
      if ($_SERVER["REQUEST_METHOD"] === "POST") {
        if (empty($_POST["contactName"])) {
          $contactNameErr = "Contact name is required";
        } else {
          $contactName = test_input($_POST["contactName"]);
        }
      }
    } else {
      if (isset($_POST["submit"])) {
        echo $_SESSION["form_token"];
        echo "There was a problem with the session. Please <a href=\"contact.php\">try again</a>.";
      }
    }
    ?>

  </head>

  <?php
    $newToken = generate_form_token("form");
  ?>
  
  <body>
    <header>
      <img src="../images/temp-header.png" alt="ACITrack"/>
      <div class="header-text">ACITrack</div>
    </header>
      
    <nav>
      <ul>
	<li><a href="../index.html">Home</a></li>
	<li class="menu">
	  <a href="../products.html" class="menu-head">Products</a>
	  <div class="menu-content">
	    <a href="../product-1.html">Product 1</a>
	    <a href="../product-2.html">Product 2</a>
	    <a href="../product-3.html">Product 3</a>
	  </div>
	</li>
	<li><a href="../news.html">News</a></li>
	<li><a href="../partners.html">Partners</a></li>
	<li><a class="nav-active" href="contact.php">Contact</a></li>
	<li><a href="../about.html">About</a></li>
      </ul>
    </nav>

    <article>
      If you would like a demo or further information, please fill in the form below and we will contact you.
      
      <p><span class="error">* required field.</span></p>
      <form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>">
        Institution name: <input type="text" name="institutionName" required/>
        <span class="error"><?php echo $institutionNameErr;?></span>
        <br/><br/>
        Institution type: <select name="institutionType" required/>
          <option value="primary">Primary School</option>
          <option value="secondary">Secondary School</option>
          <option value="academyChain">Academy Chain</option>
        </select>
        <br/><br/>
        Website: <input type="url" name="institutionWebsite"/>
        <span class="error"><?php echo $institutionWebsiteErr;?></span>
        <br/><br/>
        Contact name: <input type="text" name="contactName" required/>
        <span class="error"><?php echo $contactNameErr;?></span>
        <br/><br/>
        Contact e-mail: <input type="email" name="contactEmail" required/>
        <span class="error"><?php echo $contactEmailErr;?></span>
        <br/><br/>
        Contact phone number: <input type="text" name="contactPhone"/>
        <span class="error"><?php echo $contactPhoneErr;?></span>
        <br/><br/>
        Position: <select name="contactPosition">
          <option value="head">Head</option>
	  <option value="deputyHead">Deputy Head</option>
	  <option value="dataManager">Data Manager</option>
	  <option value="other">Other</option>
        </select>
        <br/><br/>
        <input type="submit" name="submit" value="Submit"/>
        <input type="reset" name="reset" value="Reset"/>
        <input type="hidden" name="token" value="<?php echo $newToken;?>">
      </form>
    </article>

    <?php
      ini_set('display_errors', 'On');
      error_reporting(E_ALL);
    ?>
  </body>
</html>

