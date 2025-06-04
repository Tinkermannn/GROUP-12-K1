import subprocess
import sys
import os
import time

# List of test scripts to run
test_scripts = [
    "performance_test.py",
    "consistency_test.py",
    "schema_evolution_test.py",
    "data_locality_test.py"
]

# Ensure Python environment is set up
try:
    import requests
    import pandas
    import matplotlib
    import seaborn
except ImportError:
    print("Required Python libraries not found. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "pandas", "matplotlib", "seaborn"])
    print("Libraries installed. Please re-run the script.")
    sys.exit(1)

def run_script(script_name):
    print(f"\n{'='*10} Running {script_name} {'='*10}")
    try:
        # Use sys.executable to ensure the correct python interpreter is used
        # Use Popen to allow real-time output
        process = subprocess.Popen([sys.executable, script_name], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        for line in process.stdout:
            print(line, end='')
        process.wait()
        if process.returncode != 0:
            print(f"Error: {script_name} exited with code {process.returncode}")
            return False
    except Exception as e:
        print(f"Failed to run {script_name}: {e}")
        return False
    print(f"\n{'='*10} Finished {script_name} {'='*10}\n")
    return True

if __name__ == "__main__":
    print("Starting comprehensive benchmark suite...")

    # Optional: Initial Docker cleanup and startup - ensures a clean slate
    print("\n--- Ensuring Docker containers are up and rebuilt ---")
    try:
        # Navigate to the directory containing docker-compose.yml if not already there
        # Assuming docker-compose.yml is in the parent directory of the scripts
        script_dir = os.path.dirname(os.path.abspath(__file__))
        docker_compose_dir = os.path.abspath(os.path.join(script_dir, os.pardir, os.pardir)) # Adjust based on your actual structure

        print(f"Attempting to run docker-compose from: {docker_compose_dir}")
        
        # Stop and remove existing containers, then rebuild and start
        subprocess.run(["docker-compose", "down"], cwd=docker_compose_dir, check=True, capture_output=True)
        print("Docker containers stopped and removed.")
        subprocess.run(["docker-compose", "up", "--build", "-d"], cwd=docker_compose_dir, check=True, capture_output=True)
        print("Docker containers rebuilt and started. Waiting a moment for services to stabilize...")
        time.sleep(15) # Give services time to fully initialize
        print("Services should be ready.")
    except subprocess.CalledProcessError as e:
        print(f"Error during Docker setup: {e.stderr.decode()}")
        print("Please ensure Docker is running and docker-compose.yml is correctly configured.")
        sys.exit(1)
    except FileNotFoundError:
        print("Error: 'docker-compose' command not found. Is Docker Desktop installed and in PATH?")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred during Docker setup: {e}")
        sys.exit(1)

    all_successful = True
    for script in test_scripts:
        if not run_script(script):
            all_successful = False
            print(f"Benchmark suite aborted due to failure in {script}.")
            break
    
    if all_successful:
        print("\nComprehensive benchmark suite completed successfully!")
    else:
        print("\nComprehensive benchmark suite completed with failures.")

    print("\n--- Post-test Docker cleanup (optional) ---")
    try:
        # Assuming docker-compose.yml is in the parent directory of the scripts
        script_dir = os.path.dirname(os.path.abspath(__file__))
        docker_compose_dir = os.path.abspath(os.path.join(script_dir, os.pardir, os.pardir))

        subprocess.run(["docker-compose", "down"], cwd=docker_compose_dir, check=True, capture_output=True)
        print("Docker containers stopped and removed after testing.")
    except Exception as e:
        print(f"Error during post-test Docker cleanup: {e}")

