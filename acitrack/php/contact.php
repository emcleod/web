<?php
  session_start();
?>

<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <!-- TODO keywords -->
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
      
      function clean_input($data) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_COMPAT, "UTF-8", true);
	$data = htmlentities($data, ENT_NOQUOTES);
        return strip_tags($data);
      }

      function validate_school_name($data) {
        $valid = "/^[\w]+[\w\d\s.,\/'&\-]*/";
        return preg_match($valid, $data);
      }

      function validate_name($data) {
        $valid = "/^[\w]+[\w\d\s.,'\-]*/";
        return preg_match($valid, $data);      
      }

      function validate_phone_number($data) {
        $valid = "/^((\+[1-9]{1,3}\s[^0]{1})|0)/";
        return preg_match($valid, $data);
      }
      
      $whitelist = array("institutionName", "institutionType", "institutionWebsite", "contactName",
                         "contactEmail", "contactPosition", "contactPhone", "comment", "submit", "token");
      if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["submit"]) && validate_form_token("form")) {
        foreach ($_POST as $key => $value) {
          if (!in_array($key, $whitelist)) {
            echo "Unexpected header";
            exit;
          }
        }

        $contactName = $contactEmail = $contactPosition = $contactPhone = "";
        $institutionName = $institutionType = $institutionWebsite = "";
        $comment = "";
      
        $contactNameErr = $contactEmailErr = $contactPhoneErr = "";
        $institutionNameErr = $institutionTypeErr = $institutionWebsiteErr = "";
        $commentErr = "";
    
        if (empty($_POST["institutionName"])) {
          $institutionNameErr = "Please enter a name.";
        } else {
          $temp = clean_input($_POST["institutionName"]);
          if (!validate_school_name($temp)) {
            $institutionNameErr = "Please enter a valid name (letters, numbers, & / , ' and - only).";
          } else {
            $institutionName = $temp;
          }
        }

        $institutionType = $_POST["institutionType"];
    
        if (!empty($_POST["institutionWebsite"])) {
          $temp = clean_input($_POST["institutionWebsite"]);
          if (!filter_var($temp, FILTER_VALIDATE_URL)) {
            $institutionWebsiteErr = "Please enter a valid address e.g. http://www.school-name.ac.uk.";
          } else {
            $institutionWebsite = $temp;
          }
        }
    
        if (empty($_POST["contactName"])) {
          $contactNameErr = "Please enter a name.";
        } else {
          $temp = clean_input($_POST["contactName"]);
          if (!validate_name($temp)) {
            $contactNameErr = "Please enter a valid name (letters, ' and - only).";
          } else {
            $contactName = $temp;          
          }
        }

        if (empty($_POST["contactEmail"])) {
          $contactEmailErr = "Please enter an email address";
        } else {
          $temp = clean_input($_POST["contactEmail"]);
          if (!filter_var($temp, FILTER_VALIDATE_EMAIL)) {
            $contactEmailErr = "Please enter a valid email address.";
          } else {
            $contactEmail = $temp;
          }
        }

        if (!empty($_POST["contactPhone"])) {
          $temp = clean_input($_POST["contactPhone"]);
          if (!validate_phone_number($temp)) {
            $contactPhoneErr = "Please enter a valid phone number e.g. 020 xxxx xxxx or +44 20 xxxx xxxx.";
          } else {
            $contactPhone = $temp;
          }    
        }

        $contactPosition = $_POST["contactPosition"];
    
        if (!empty($_POST["comment"])) {
          $temp = clean_input($_POST["comment"]);
          if (strlen($temp) > 2000) {
            $commentErr = "Comment is too long.";
          } else {
            $comment = $temp;
          }
        }

        if ($institutionName !== "" && $institutionType !== "" && $institutionWebsiteErr === "" &&
            $contactName !== "" && $contactEmail !== "" && $contactPhoneErr === "" && $commentErr === "") {
          echo "Would have sent this email:<br/>";
          echo "Institution: " . $institutionName . "<br/>";
          echo "Institution type: " . $institutionType . "<br/>";
          echo "Institution website: " . $institutionWebsite . "<br/>";
          echo "Contact name: " . $contactName . "<br/>";
          echo "Contact email: " . $contactEmail . "<br/>";
          echo "Contact position: " . $contactPosition . "<br/>";
          echo "Contact phone number: " . $contactPhone . "<br/>";
          echo "Comment: " . $comment . "<br/>";
          echo "I would have redirected to a thank you page<br/>";
        }
      } else {    
        if (isset($_POST["submit"])) {
          include($_SERVER["DOCUMENT_ROOT"]."/error.html");
          exit;
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
      If you would like a demo or further information, please fill in the form below and we will contact you as soon as possible.
      <br/><br/><br/>
      <p><span class="error">* required field.</span></p>
      <form method="post" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>">
        Institution name: <input type="text" name="institutionName" required/>
        <span class="error">* <?php echo $institutionNameErr;?></span>
        <br/><br/>
        Institution type: <select name="institutionType" required/>*
          <option value="primary">Primary School</option>
          <option value="secondary">Secondary School</option>
          <option value="academyChain">Academy Chain</option>
        </select>
        <br/><br/>
        Website: <input type="url" name="institutionWebsite"/>
        <span class="error"><?php echo $institutionWebsiteErr;?></span>
        <br/><br/>
        Contact name: <input type="text" name="contactName" required/>
        <span class="error">* <?php echo $contactNameErr;?></span>
        <br/><br/>
        Contact e-mail: <input type="email" name="contactEmail" required/>
        <span class="error">* <?php echo $contactEmailErr;?></span>
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
	Comment:<br/>
	<textarea name="comment" rows="10" cols="120"></textarea>
	<span class="error"><?php echo $commentErr;?></span>
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

