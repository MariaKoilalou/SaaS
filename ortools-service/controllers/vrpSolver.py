import json
import os
import sys
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from math import radians, sin, cos, sqrt, atan2
import time  # To simulate progress

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance between two points on the Earth's surface."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = 6371 * c  # Earth radius in kilometers
    return int(round(1000 * distance))

def calculate_distance_matrix(locations):
    num_locations = len(locations)
    distance_matrix = [[0] * num_locations for _ in range(num_locations)]

    for i in range(num_locations):
        for j in range(num_locations):
            lat1, lon1 = locations[i]['Latitude'], locations[i]['Longitude']
            lat2, lon2 = locations[j]['Latitude'], locations[j]['Longitude']
            distance_matrix[i][j] = haversine_distance(lat1, lon1, lat2, lon2)
    return distance_matrix

def create_data_model(locations, num_vehicles, depot):
    data = {}
    data["distance_matrix"] = calculate_distance_matrix(locations)
    data["num_vehicles"] = num_vehicles
    data["depot"] = depot
    return data

def print_solution(data, manager, routing, solution):
    max_route_distance = 0
    for vehicle_id in range(data["num_vehicles"]):
        index = routing.Start(vehicle_id)
        route_distance = 0
        while not routing.IsEnd(index):
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(
                previous_index, index, vehicle_id
            )
        max_route_distance = max(route_distance, max_route_distance)
    return max_route_distance

def read_json_file(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
        return data.get('Locations', [])

def main():
    if len(sys.argv) != 5:
        print("Wrong number of args.\nUsage: python <script_name.py> <input_file.json> <num_vehicles> <depot> <max_distance>")
        sys.exit(1)

    input_file = os.path.abspath(sys.argv[1])
    num_vehicles = int(sys.argv[2])
    depot = int(sys.argv[3])
    max_distance = int(sys.argv[4])

    locations = read_json_file(input_file)
    data = create_data_model(locations, num_vehicles, depot)

    manager = pywrapcp.RoutingIndexManager(
        len(data["distance_matrix"]), data["num_vehicles"], data["depot"]
    )
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data["distance_matrix"][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    dimension_name = "Distance"
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        max_distance,  # vehicle maximum travel distance
        True,  # start cumul to zero
        dimension_name,
    )
    distance_dimension = routing.GetDimensionOrDie(dimension_name)
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC

    # Solve the problem and print progress
    solution = routing.SolveWithParameters(search_parameters)
    if solution:
        # Simulate progress updates while printing the solution
        for progress in range(10, 101, 10):
            print(json.dumps({"progress": progress}), flush=True)  # Progress updates
            time.sleep(1)  # Simulate work being done

        # Final solution
        max_route_distance = print_solution(data, manager, routing, solution)
        print(json.dumps({
            "progress": 100,
            "result": f"Maximum route distance: {max_route_distance}m"
        }), flush=True)
    else:
        print(json.dumps({"error": "No solution found"}), flush=True)

if __name__ == "__main__":
    main()
