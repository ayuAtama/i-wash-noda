export async function GET() {
  const res = await fetch("http://ip-api.com/json/");
  const data = await res.json();
  console.log(data);

  return Response.json({
    latitude: data.lat,
    longitude: data.lon,
    city: data.city,
    region: data.regionName,
  });
}
