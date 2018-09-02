def getShapes():
	contents = open("109 shapes.txt", "r").readlines()
	newFile = open("new code", "w")

	for line in contents:
		tokenized = line.split(",")
		lat = tokenized[1].strip()
		lon = tokenized[2].strip()
		newFile.write("pts.add(new Vector(" + lat + ", " + lon + "));\n")

	newFile.close()

def getStops():
	tripID = "17490984"
	stop_times = open("stop_times.txt", "r").readlines()
	stops = open("stops.txt", "r").readlines();
	newFile = open("new code", "w")

	for i in range(1, len(stop_times)):
		stop_time = [ content.strip() for content in stop_times[i].split(",") ]
		if stop_time[0] == tripID:
			stop_id = stop_time[3]

			for j in range(1, len(stops)):
				stop = [ content.strip() for content in stops[j].split(",") ]
				if stop[0] == stop_id:
					newFile.write("stop = new Stop(new Vector(" + stop[4] + ", " + stop[5] + "));\n")
					newFile.write("stop.setName(" + stop[2] + ");\n")
					newFile.write("stops.add(stop);\n")

	newFile.close()

getStops()

