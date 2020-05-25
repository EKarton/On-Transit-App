from pyspark.sql.types import *
from pyspark.sql import *
from pyspark.sql import functions as F
from pyspark import SparkConf, SparkContext

spark = SparkSession.builder.master("local").appName("My App").getOrCreate()

df = spark.range(500).toDF("number")
df.