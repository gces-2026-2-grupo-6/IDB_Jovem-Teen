const TOKEN_KEY = "idb_token";

function fakeAdminToken(roles = ["admin", "superadmin"]) {
  const base64url = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const header = base64url({ alg: "HS256", typ: "JWT" });
  const payload = base64url({
    name: "IDB Jovem",
    preferred_username: "idbjovem",
    email: "idbjovem@example.com",
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    realm_access: { roles },
  });

  return `${header}.${payload}.signature`;
}

export async function loginAsAdmin(page) {
  await page.addInitScript(({ key, token }) => {
    window.localStorage.setItem(key, token);
  }, { key: TOKEN_KEY, token: fakeAdminToken() });
}

// Admin comum (sem o papel superadmin), p/ validar as rotas restritas ao superadmin.
export async function loginAsPlainAdmin(page) {
  await page.addInitScript(({ key, token }) => {
    window.localStorage.setItem(key, token);
  }, { key: TOKEN_KEY, token: fakeAdminToken(["admin"]) });
}

// Credenciais válidas: idbjovem/idbjovem. Qualquer outra → 401 (Keycloak
// responde "Invalid user credentials").
export async function mockKeycloakLogin(page) {
  await page.route("**/protocol/openid-connect/token", (route) => {
    const params = new URLSearchParams(route.request().postData() || "");
    const ok =
      params.get("username") === "idbjovem" && params.get("password") === "idbjovem";

    if (!ok) {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error_description: "Invalid user credentials" }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: fakeAdminToken(),
        token_type: "Bearer",
        expires_in: 3600,
      }),
    });
  });
}
