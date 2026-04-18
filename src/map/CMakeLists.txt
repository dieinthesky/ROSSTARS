#
# setup
#
set( MAP_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}  CACHE INTERNAL "" )


#
# map server
#
if( BUILD_SERVERS )
message( STATUS "Creating target map-server" )
file(GLOB MAP_HEADERS CONFIGURE_DEPENDS ${MAP_SOURCE_DIR}/*.hpp)
file(GLOB MAP_SOURCES CONFIGURE_DEPENDS ${MAP_SOURCE_DIR}/*.cpp)
list(APPEND MAP_SOURCES ${MAP_SOURCE_DIR}/rostars_bg_overlay_api.cpp)
list(REMOVE_DUPLICATES MAP_SOURCES)
if( ENABLE_MAP_BG_OVERLAY_API )
	set( DEPENDENCIES common ryml httplib )
	set( INCLUDE_DIRS ${GLOBAL_INCLUDE_DIRS} ${COMMON_BASE_INCLUDE_DIRS} ${HTTPLIB_INCLUDE_DIRS} ${RA_INCLUDE_DIRS} ${MYSQL_INCLUDE_DIRS} )
	set( DEFINITIONS "${GLOBAL_DEFINITIONS} ${COMMON_BASE_DEFINITIONS} -DENABLE_MAP_BG_OVERLAY_API" )
else()
	set( DEPENDENCIES common ryml )
	set( INCLUDE_DIRS ${GLOBAL_INCLUDE_DIRS} ${COMMON_BASE_INCLUDE_DIRS} ${RA_INCLUDE_DIRS} ${MYSQL_INCLUDE_DIRS} )
	set( DEFINITIONS "${GLOBAL_DEFINITIONS} ${COMMON_BASE_DEFINITIONS}" )
endif()
set( LIBRARIES ${GLOBAL_LIBRARIES} ${MYSQL_LIBRARIES} )
if( WITH_PCRE )
	message( STATUS "Enabled PCRE code" )
	set( LIBRARIES ${LIBRARIES} ${PCRE_LIBRARIES} )
	set( INCLUDE_DIRS ${INCLUDE_DIRS} ${PCRE_INCLUDE_DIRS} )
	set( DEFINITIONS "${DEFINITIONS} -DPCRE_SUPPORT" )
else()
	message( STATUS "Disabled PCRE code" )
endif()
set( SOURCE_FILES ${COMMON_BASE_HEADERS} ${COMMON_HEADERS} ${MAP_HEADERS} ${MAP_SOURCES} )
source_group( common FILES ${COMMON_BASE_HEADERS} ${COMMON_HEADERS} )
source_group( map FILES ${MAP_HEADERS} ${MAP_SOURCES} )
include_directories( ${INCLUDE_DIRS} )

#message( STATUS "map-server SOURCE_FILES=${SOURCE_FILES}")
add_executable( map-server ${SOURCE_FILES} )
#message( STATUS "map-server LIBRARIES=${LIBRARIES}, DEPENDENCIES=${DEPENDENCIES} DEFINITIONS=${DEFINITIONS}")
add_dependencies( map-server ${DEPENDENCIES} )
target_link_libraries( map-server ${LIBRARIES} ${DEPENDENCIES} )
set_target_properties( map-server PROPERTIES COMPILE_FLAGS "${DEFINITIONS}" )
# MSVC: /FS avoids C1041 when /MP uses several cl.exe on the same vc*.pdb (apply per-target; global add_compile_options can upset some VS/CMake setups)
if( MSVC )
	target_compile_options( map-server PRIVATE /FS )
endif()
if( INSTALL_COMPONENT_RUNTIME )
	cpack_add_component( Runtime_mapserver DESCRIPTION "map-server" DISPLAY_NAME "map-server" GROUP Runtime )
	install( TARGETS map-server
		DESTINATION "."
		COMPONENT Runtime_mapserver )
endif( INSTALL_COMPONENT_RUNTIME )
set( TARGET_LIST ${TARGET_LIST} map-server  CACHE INTERNAL "" )
message( STATUS "Creating target map-server - done" )
endif( BUILD_SERVERS )
