from pyspark.sql.types import *
from pyspark.sql import *
from pyspark.sql import functions as F

def reduce_geocoordinates_precision(dataframe):
    def reduce_lat_long_precision(amount):
        return round(amount, 5)

    reduce_num_decimal_places_udf = F.udf(reduce_lat_long_precision, DoubleType())

    dataframe = dataframe.withColumn(
        "latitude", reduce_num_decimal_places_udf(dataframe.latitude)
    )
    dataframe = dataframe.withColumn(
        "longitude", reduce_num_decimal_places_udf(dataframe.longitude)
    )

    return dataframe

def rename_columns(dataframe, renamed_columns):
    for old_name, new_name in renamed_columns.items():
        dataframe = dataframe.withColumnRenamed(old_name, new_name)
    return dataframe

