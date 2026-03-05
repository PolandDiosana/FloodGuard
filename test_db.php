<?php
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "floodguard";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully to database '$dbname'";

$sql = "SELECT id, username, role FROM admins";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
  // output data of each row
  while($row = $result->fetch_assoc()) {
    echo "\nid: " . $row["id"]. " - Name: " . $row["username"]. " - Role: " . $row["role"];
  }
} else {
  echo "\n0 results in admins table";
}
$conn->close();
?>
