const database = "3it_andrejkulicm23";
const username = "andrejkulicm23";
const password = "huntercraft2";
const server = "localhost";

export async function sql(sqlQuery) {
  const url = "http://marcincin.epsilon.spstrutnov.cz/gate.php";
  const postJson = JSON.stringify({
    database,
    username,
    password,
    server,
    sql: sqlQuery,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: postJson,
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();

    if (json && json.error) {
      throw new Error(json.error);
    }

    if (json && json.success === false) {
      throw new Error(json.message || "Databázová operace selhala.");
    }

    return json;
  } catch (error) {
    console.error("SQL error:", error);
    throw error;
  }
}

export async function getRatings() {
  return sql("SELECT `id`, `rating` FROM `rating` ORDER BY `id` DESC");
}

export async function addRating(rating) {
  const value = Number(rating);
  return sql(`INSERT INTO \`rating\` (\`rating\`) VALUES (${value})`);
}
