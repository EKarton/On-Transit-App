import requests

DOMAIN = "<databricks-instance>"
TOKEN = "<your-token>"

response = requests.post(
    "https://%s/api/2.0/clusters/create" % (DOMAIN),
    headers={"Authorization": "Bearer %s" % TOKEN},
    json={
        "cluster_name": "my-cluster",
        "spark_version": "5.5.x-scala2.11",
        "node_type_id": "i3.xlarge",
        "spark_env_vars": {"PYSPARK_PYTHON": "/databricks/python3/bin/python3"},
        "num_workers": 25,
    },
)

if response.status_code == 200:
    print(response.json()["cluster_id"])
else:
    print(
        "Error launching cluster: %s: %s"
        % (response.json()["error_code"], response.json()["message"])
    )

